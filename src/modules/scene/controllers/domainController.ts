//
//  DomainController.ts
//
//  Created by Nolan Huang on 1 Aug 2022.
//  Copyright 2022 Vircadia contributors.
//  Copyright 2022 DigiSomni LLC.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

/* eslint-disable @typescript-eslint/no-magic-numbers */

import { ScriptComponent, inspectorAccessor, inspector } from "@Modules/script";

// General Modules
import Log from "@Modules/debugging/log";
import { GameObject } from "@Modules/object";
import { MyAvatarController } from "@Modules/avatar";

// Domain Modules
import { DomainMgr } from "@Modules/domain";
import { Client, AssignmentClientState } from "@Modules/domain/client";
import { Domain, ConnectionState } from "@Modules/domain/domain";
import { AvatarMixer, Uuid, ScriptAvatar, DomainServer,
    EntityServer, Camera as DomainCamera } from "@vircadia/web-sdk";
import { EntityManager, IEntity, EntityMapper } from "@Modules/entity";
import { VScene } from "../vscene";
import { Camera } from "@babylonjs/core";

export class DomainController extends ScriptComponent {
    _avatarMixer : Nullable<AvatarMixer> = null;
    _entityServer : Nullable<EntityServer> = null;
    _domainConnectionState : ConnectionState = ConnectionState.DISCONNECTED;
    _entityManager : Nullable<EntityManager> = null;
    _domainCamera : Nullable<DomainCamera> = null;
    _vscene : Nullable<VScene>;
    _camera : Nullable<Camera> = null;

    @inspector()
        _sessionID = "";

    constructor() {
        super("DomainController");
        this._handleActiveDomainStateChange = this._handleActiveDomainStateChange.bind(this);
    }

    public set vscene(value : VScene) {
        this._vscene = value;
    }

    @inspectorAccessor()
    public get domainState(): string {
        return DomainServer.stateToString(this._domainConnectionState);
    }

    @inspectorAccessor()
    public get avatarMixerState(): string {
        return this._avatarMixer
            ? AvatarMixer.stateToString(this._avatarMixer.state)
            : AvatarMixer.stateToString(AssignmentClientState.UNAVAILABLE);
    }

    @inspectorAccessor()
    public get entityServerState(): string {
        return this._entityServer
            ? Client.stateToString(this._entityServer.state)
            : Client.stateToString(AssignmentClientState.UNAVAILABLE);
    }


    /**
    * Gets a string identifying the type of this Component
    * @returns "DomainController" string
    */
    // eslint-disable-next-line class-methods-use-this
    public get componentType():string {
        return "DomainController";
    }

    public onInitialize(): void {
        Log.debug(Log.types.OTHER,
            `DomainController onInitialize`);

        // Listen for the domain to connect and disconnect
        DomainMgr.onActiveDomainStateChange.connect(this._handleActiveDomainStateChange.bind(this));

        GameObject.dontDestroyOnLoad(this._gameObject as GameObject);
    }


    public onUpdate():void {
        if (this._entityManager) {
            this._entityManager.update();
        }

        // this._syncCamera();
    }

    public onStop(): void {
        Log.debug(Log.types.OTHER,
            `DomainController onStop`);
        DomainMgr.onActiveDomainStateChange.disconnect(this._handleActiveDomainStateChange.bind(this));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _handleActiveDomainStateChange(pDomain: Domain, pState: ConnectionState, pInfo: string): void {

        Log.debug(Log.types.COMM, `handleActiveDomainStateChange: ${Domain.stateToString(pState)}`);

        if (pState === ConnectionState.CONNECTED) {
            void this._handleDomainConnected(pDomain);

        } else if (pState === ConnectionState.DISCONNECTED) {
            this._vscene?.unloadAllAvatars();

            if (this._vscene && this._vscene._myAvatar) {
                const myAvatarController = this._vscene._myAvatar.getComponent(
                    MyAvatarController.typeName) as MyAvatarController;
                if (myAvatarController) {
                    myAvatarController.myAvatar = null;
                }
            }

            const avatarList = this._avatarMixer?.avatarList;
            if (avatarList) {
                avatarList.avatarAdded.disconnect(this._handleAvatarAdded);
                avatarList.avatarRemoved.disconnect(this._handleAvatarRemoved);
            }

            this._avatarMixer = null;
            this._entityServer = null;
            this._entityManager = null;
            this._domainCamera = null;
            this._camera = null;
        }

        this._domainConnectionState = pState;
    }

    private async _handleDomainConnected(pDomain: Domain): Promise<void> {
        if (!this._vscene) {
            return;
        }

        this._entityServer = pDomain.EntityClient;
        if (this._entityServer) {
            this._entityServer.onStateChanged = this._handleOnEntityServerStateChanged.bind(this);
        }

        await this._vscene.load();
        this._vscene.teleportMyAvatar(pDomain.Location);

        if (pDomain.DomainClient) {
            this._sessionID = pDomain.DomainClient.sessionUUID.stringify();
        }
        Log.debug(Log.types.AVATAR, `Session ID: ${this._sessionID}`);

        this._avatarMixer = pDomain.AvatarClient?.Mixer;
        const myAvatarInterface = pDomain.AvatarClient?.MyAvatar;
        if (myAvatarInterface) {
            if (myAvatarInterface.skeletonModelURL === "") {
                myAvatarInterface.skeletonModelURL = this._vscene.myAvatarModelURL;
            }

            const gameObject = this._vscene._myAvatar;
            if (gameObject) {
                const myAvatarController = gameObject.getComponent(MyAvatarController.typeName) as MyAvatarController;
                myAvatarController.myAvatar = myAvatarInterface;
            }
        }

        const avatarList = this._avatarMixer?.avatarList;
        if (avatarList) {
            avatarList.avatarAdded.connect(this._handleAvatarAdded);
            avatarList.avatarRemoved.connect(this._handleAvatarRemoved);

            const uuids = avatarList.getAvatarIDs();
            const emptyId = new Uuid();

            uuids.forEach((uuid) => {
                // filter my avatar
                if (uuid.stringify() !== emptyId.stringify()) {
                    this._handleAvatarAdded(uuid);
                }
            });
        }

        this._camera = this._vscene.camera;
        this._domainCamera = pDomain.Camera;
        // this._syncCamera();
    }

    private _handleAvatarAdded = (sessionID: Uuid): void => {
        const avatarList = this._avatarMixer?.avatarList;
        if (avatarList) {
            Log.debug(Log.types.AVATAR,
                `AvatarAdded. Session ID: ${sessionID.stringify()}`);

            const domain = avatarList.getAvatar(sessionID);

            if (domain.skeletonModelURL !== "") {
                void this._vscene?.loadAvatar(sessionID, domain);
            }

            domain.skeletonModelURLChanged.connect(() => {
                this._handleAvatarSkeletonModelURLChanged(sessionID, domain);
            });
        }
    };

    private _handleAvatarRemoved = (sessionID: Uuid): void => {
        Log.debug(Log.types.AVATAR,
            `handleAvatarRemoved. Session ID: ${sessionID.stringify()}`);
        this._vscene?.unloadAvatar(sessionID);

    };

    private _handleAvatarSkeletonModelURLChanged(sessionID:Uuid, domain:ScriptAvatar): void {
        Log.debug(Log.types.AVATAR,
            `handleAvatarSkeletonModelURLChanged. Session ID: ${sessionID.stringify()}, ${domain.skeletonModelURL}`);

        void this._vscene?.loadAvatar(sessionID, domain);
    }

    private _handleOnEntityServerStateChanged(state: AssignmentClientState): void {
        Log.info(Log.types.ENTITIES,
            `Entity Sever state changed. New state: ${Client.stateToString(state)}`);

        if (state === AssignmentClientState.CONNECTED) {
            this._entityManager = new EntityManager(this._entityServer as EntityServer);
            this._entityManager.onEntityAdded.add(this._handleOnEntityAdded.bind(this));
            this._entityManager.onEntityRemoved.add(this._handleOnEntityRemoved.bind(this));
        } else if (state === AssignmentClientState.DISCONNECTED) {
            this._entityManager = null;
        }
    }

    private _handleOnEntityAdded(entity : IEntity) {
        Log.debug(Log.types.ENTITIES,
            `Add entity ${entity.id}
            name:${entity.name as string}
            type: ${entity.type}`);

        this._vscene?.loadEntity(entity);
    }

    private _handleOnEntityRemoved(entity : IEntity) {
        Log.debug(Log.types.ENTITIES,
            `Remove entity ${entity.id}
            name:${entity.name as string}
            type: ${entity.type}`);

        this._vscene?.removeEntity(entity.id);
    }

    private _syncCamera() {
        if (this._domainCamera && this._camera) {
            this._domainCamera.position = EntityMapper.mapToVector3Property(this._camera.globalPosition);
            this._domainCamera.orientation = EntityMapper.mapToQuaternionProperty(this._camera.absoluteRotation);
        }
    }
}
