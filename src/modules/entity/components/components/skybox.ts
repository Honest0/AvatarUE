/* eslint-disable class-methods-use-this */
//
//  KeyLigth.ts
//
//  Created by Nolan Huang on 27 Jul 2022.
//  Copyright 2022 Vircadia contributors.
//  Copyright 2022 DigiSomni LLC.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import { MeshComponent, DEFAULT_MESH_RENDER_GROUP_ID } from "@Modules/object";
import { Scene, MeshBuilder, StandardMaterial,
    Texture, CubeTexture, EquiRectangularCubeTexture, BaseTexture } from "@babylonjs/core";
import { ISkyboxProperty, IVector3Property } from "../../EntityProperties";
import { EntityMapper } from "../../package";
import { AssetUrl } from "../../builders/asset";

/* eslint-disable new-cap */

export class SkyboxComponent extends MeshComponent {
    static readonly DefaultSkyBoxSize = 2000;
    static readonly DefaultCubeMapSize = 1024;

    public get componentType():string {
        return SkyboxComponent.typeName;
    }

    static get typeName(): string {
        return "Skybox";
    }

    public load(props: ISkyboxProperty, dimensions: IVector3Property | undefined, id: string) : void {
        if (this._mesh) {
            this._mesh.dispose();
            this._mesh = null;
        }

        if (!this._gameObject) {
            return;
        }

        let skyBox = null;
        const scene = this._gameObject ? this._gameObject?.getScene() : null;
        if (dimensions) {
            skyBox = MeshBuilder.CreateBox(this.componentType,
                { width: dimensions.x, height: dimensions.y, depth: dimensions.z },
                scene);
        } else {
            skyBox = MeshBuilder.CreateBox(this.componentType,
                { size: SkyboxComponent.DefaultSkyBoxSize }, scene);
        }
        skyBox.infiniteDistance = true;
        skyBox.id = id;
        skyBox.renderingGroupId = DEFAULT_MESH_RENDER_GROUP_ID;

        this.mesh = skyBox;

        this.update(props);
    }

    public update(props: ISkyboxProperty) : void {
        if (this._mesh) {
            const scene = this._mesh.getScene();
            let material = this._mesh.material as StandardMaterial;

            if (!material) {
                material = new StandardMaterial(`${this._mesh.name}_${this._mesh.id}`, scene);
                material.backFaceCulling = false;
                material.disableLighting = true;
                this._mesh.material = material;
            }

            material.diffuseColor = EntityMapper.mapToColor3(props.color);
            material.specularColor = EntityMapper.mapToColor3(props.color);

            if (props.url && props.url !== material.reflectionTexture?.name) {
                if (material.reflectionTexture) {
                    material.reflectionTexture.dispose();
                }

                material.reflectionTexture = this.createflectionTexture(props.url, scene);
            }
        }
    }

    private createflectionTexture(url: string, scene:Scene) : BaseTexture {
        let reflectionTexture = null;

        const assetUrl = new AssetUrl(url);

        if (assetUrl.fileExtension === "") {
            reflectionTexture = new CubeTexture(url, scene);
        } else {

            // TODO: support Cubemaps with one image
            reflectionTexture = new EquiRectangularCubeTexture(url, scene, SkyboxComponent.DefaultCubeMapSize);
        }

        reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;

        return reflectionTexture;
    }

}
