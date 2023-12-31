<!-- eslint-disable max-len -->
<!--
//  MainLayout.vue
//
//  Created by Kalila L. on May 9th, 2021.
//  Copyright 2021 Vircadia contributors.
//  Copyright 2022 DigiSomni LLC.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
-->
<!--
    Display of the main page.
    The page is a usual Vue page with a hidden menu bar on the left controlled by
    an "account_circle" in the top menu bar.
    The page top bar contains connected information.
    Overlay dialogs are controlled by ApplicationStore.dialog settings.
-->

<style scoped lang="scss">
.verticalAudioLevel {
    position: relative;
    display: block;
    width: 0.7ch;
    min-height: 40px;
    color: $primary;
    font-size: 1rem;
    background-color: #8884;
    border-radius: 0.7ch;
    overflow: hidden;

    > span {
        position: absolute;
        bottom: 0px;
        display: block;
        width: 100%;
        height: 0%;
        color: inherit;
        background-color: currentColor;
        border-radius: inherit;
        transition: 0.05s ease height;
    }
}
</style>

<style lang="scss">
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

<template>
    <q-layout class="full-height" id="mainLayout" view="lHh Lpr lFf">
        <q-header
            id="header"
            elevated
            style="color: unset;background-color: unset;"
            :style="{background: headerStyle}"
        >
            <div class="row no-wrap">
<!--
                <q-toolbar
                    class="col-8"
                >
                    <q-input rounded outlined v-model="locationInput" class="q-mr-md" label="Connect to" />
                    <q-btn-group push>
                        <q-btn push label="Connect" icon="login" @click="connect" />
                        <q-btn push label="Disconnect" icon="close" @click="disconnect" />
                    </q-btn-group>
                    <q-space />

                    <div>
                        <div>{{ applicationStore.globalConsts.APP_NAME }}</div>
                        <div>{{ applicationStore.globalConsts.APP_VERSION_TAG }}</div>
                    </div>
                </q-toolbar> -->
                <q-toolbar :style="{ padding: isMobile ? '0px 0px 0px 8px' : '0px 12px' }">
                    <q-btn
                        flat
                        round
                        dense
                        icon="menu"
                        aria-label="User Menu"
                        @click="toggleUserMenu"
                        :class="{
                            'q-mr-sm': isDesktop,
                            'q-mr-xs': isMobile
                        }"
                    />
                    <q-separator dark vertical inset />

                    <q-btn
                        v-if="isDesktop"
                        flat
                        round
                        dense
                        icon="travel_explore"
                        aria-label="Explore"
                        @click="onClickOpenOverlay('Explore')"
                        class="q-mr-sm q-ml-sm"
                    />

                    <div
                        class="verticalAudioLevel q-my-auto"
                        :class="{ 'q-ml-sm': isMobile }"
                    >
                        <span
                            :class="`text-${microphoneColor}`"
                            :style="{ height: `${AudioIOInstance.inputLevel}%` }"
                        ></span>
                    </div>

                    <div>
                        <q-btn-dropdown
                            v-if="isDesktop"
                            split
                            flat
                            round
                            dense
                            fab-mini
                            :title="
                                !applicationStore.audio.user.hasInputAccess ?
                                undefined :
                                applicationStore.audio.user.muted ?
                                'Unmute microphone' :
                                'Mute microphone'"
                            :icon="applicationStore.audio.user.muted || !applicationStore.audio.user.hasInputAccess ? 'mic_off' : 'mic'"
                            :color="microphoneColor"
                            class="q-mr-sm q-ml-sm"
                            :style="{
                                backgroundColor: $q.dark.isActive ? '#282828' : '#e8e8e8'
                            }"
                            :disable-dropdown="!applicationStore.audio.user.hasInputAccess"
                            v-model="micMenuState"
                            @click="toggleMicrophoneMute"
                        >
                            <q-list style="max-width: 300px;" @click.stop="">
                                <q-item v-for="input in applicationStore.audio.inputsList" :key="input.deviceId">
                                    <q-radio
                                        @click="AudioIOInstance.requestInputAccess(input.deviceId);micMenuState = false;"
                                        v-model="AudioIOInstance.selectedInput"
                                        :val="input.label"
                                        :label="input.label"
                                        :title="input.label"
                                        color="teal"
                                        class="ellipsis"
                                    />
                                </q-item>
                            </q-list>
                        </q-btn-dropdown>
                        <q-btn
                            v-else
                            split
                            flat
                            round
                            dense
                            fab-mini
                            :title="
                                !applicationStore.audio.user.hasInputAccess ?
                                undefined :
                                applicationStore.audio.user.muted ?
                                'Unmute microphone' :
                                'Mute microphone'"
                            :icon="applicationStore.audio.user.muted || !applicationStore.audio.user.hasInputAccess ? 'mic_off' : 'mic'"
                            :color="microphoneColor"
                            @click="toggleMicrophoneMute"
                            class="q-mr-sm q-ml-sm"
                            :style="{
                                backgroundColor: $q.dark.isActive ? '#282828' : '#e8e8e8'
                            }"
                        />
                        <q-tooltip
                            v-if="!applicationStore.audio.user.hasInputAccess"
                            class="bg-black"
                            transition-show="jump-down"
                            transition-hide="jump-up"
                        >Please allow microphone access.</q-tooltip>
                    </div>

                    <q-toolbar-title
                        class="non-selectable"
                        :class="{ 'q-px-xs': isMobile }"
                    >
                        <q-item-section>
                            <q-item-label
                                style="display: flex;flex-direction: row;justify-content: flex-start;align-items: center;"
                                :style="{ fontSize: isMobile ? '0.8em' : 'inherit' }"
                            >
                                {{ getDomainServerState }}
                                <Transition>
                                    <div
                                        v-show="getDomainServerState === 'CONNECTING' || applicationStore.renderer.contentIsLoading"
                                        class="q-ml-md"
                                        style="display: flex;
                                            flex-direction: row;justify-content: flex-start;align-items: center;"
                                    >
                                        <q-spinner
                                            :size="isMobile ? 'xs' : 'sm'"
                                            :title="applicationStore.renderer.contentIsLoading ? 'Loading content' : undefined"
                                        />
                                        <p class="q-my-none q-ml-md text-caption">
                                            {{ `${applicationStore.renderer.contentLoadingSpeed.toFixed(1)}MB&sol;s` }}
                                        </p>
                                        <q-tooltip
                                            :class="{
                                                'bg-black': $q.dark.isActive,
                                                'text-white': $q.dark.isActive
                                            }"
                                            :hide-delay="300"
                                        >
                                            {{ applicationStore.renderer.contentIsLoading
                                                && applicationStore.renderer.contentLoadingInfo
                                                ? applicationStore.renderer.contentLoadingInfo : "Loading..." }}
                                        </q-tooltip>
                                    </div>
                                </Transition>
                            </q-item-label>
                        </q-item-section>
                    </q-toolbar-title>

                    <template v-if="isDesktop">
                        <q-item clickable v-ripple
                            class="non-selectable"
                            @click="userStore.account.isLoggedIn ?
                            onClickOpenOverlay('Account') : openDialog('Login', true)"
                        >
                            <q-item-section side>
                                <q-avatar size="48px">
                                    <q-img
                                        v-if="getProfilePicture"
                                        :src="getProfilePicture"
                                    />
                                    <q-icon
                                        v-else
                                        name="account_circle"
                                        size="xl"
                                    />
                                </q-avatar>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>
                                    {{ userStore.account.isLoggedIn ? userStore.account.username : "Guest" }}
                                </q-item-label>
                                <q-item-label caption>
                                    {{ userStore.account.isLoggedIn ?
                                    "Logged in" :
                                    `Click to log in to the ${applicationStore.theme.globalServiceTerm.toLowerCase()}.` }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-btn
                            v-show="userStore.account.isLoggedIn"
                            flat
                            round
                            dense
                            icon="logout"
                            aria-label="Logout"
                            @click="logout"
                            class="q-mr-sm q-ml-sm"
                        />

                        <q-separator dark vertical/>
                        <q-btn
                            flat
                            stretch
                            icon="settings"
                            aria-label="Settings Menu"
                        >
                            <q-menu v-model="settingsMenuState" @show="aMenuIsOpen = true">
                                <q-list class="non-selectable">
                                    <template v-for="(menuItem, index) in settingsMenu" :key="index">
                                        <q-item-label
                                            v-if="menuItem.isCategory"
                                            header
                                        >
                                            {{ menuItem.label }}
                                        </q-item-label>
                                        <q-item
                                            v-else
                                            clickable
                                            v-ripple
                                            @click="menuItem.action ? menuItem.action()
                                                : onClickOpenOverlay(menuItem.link || menuItem.label)"
                                        >
                                            <q-item-section avatar>
                                                <q-icon :name="menuItem.icon" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label>{{ menuItem.label }}</q-item-label>
                                                <q-item-label
                                                    v-if="menuItem.caption"
                                                    caption
                                                >
                                                    {{ formatMenuItemCaption(menuItem.caption) }}
                                                </q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-separator :key="'sep' + index" v-if="menuItem.separator" />
                                    </template>
                                </q-list>
                            </q-menu>
                        </q-btn>
                    </template>

                    <q-separator dark vertical inset />

                    <q-btn-dropdown
                        stretch
                        flat
                        :dense="isMobile"
                        :class="{ 'q-ml-xs': isMobile }"
                        :persistent="false"
                        v-model="helpMenuState"
                        @show="aMenuIsOpen = true"
                    >
                        <template v-slot:label>
                            <q-avatar rounded :size="isDesktop ? '48px' : '32px'">
                                <img :src="applicationStore.theme.logo">
                            </q-avatar>
                        </template>
                        <q-list class="q-pb-sm">
                            <template v-if="isMobile">
                                <q-item-label header>Account</q-item-label>
                                <q-item clickable v-ripple
                                    @click="userStore.account.isLoggedIn ?
                                    onClickOpenOverlay('Account') : openDialog('Login', true)"
                                >
                                    <q-item-section side>
                                        <q-avatar size="48px">
                                            <q-icon :name="getProfilePicture" size="xl"/>
                                        </q-avatar>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>
                                            {{ userStore.account.isLoggedIn ? userStore.account.username : "Guest" }}
                                        </q-item-label>
                                        <q-item-label caption>
                                            {{ userStore.account.isLoggedIn ?
                                            "Logged in" :
                                            `Click to log in to the ${applicationStore.theme.globalServiceTerm.toLowerCase()}.` }}
                                        </q-item-label>
                                    </q-item-section>
                                </q-item>
                                <q-btn
                                    v-show="userStore.account.isLoggedIn"
                                    flat
                                    round
                                    dense
                                    icon="logout"
                                    aria-label="Logout"
                                    @click="logout"
                                    class="q-mr-sm q-ml-sm"
                                />

                                <q-separator inset spaced />

                                <q-item-label header>Settings</q-item-label>
                                <template v-for="(menuItem, index) in settingsMenu" :key="index">
                                    <q-item-label
                                        v-if="menuItem.isCategory"
                                        header
                                    >
                                        {{ menuItem.label }}
                                    </q-item-label>
                                    <q-item
                                        v-else
                                        clickable
                                        v-ripple
                                        @click="menuItem.action ? menuItem.action() : onClickOpenOverlay(menuItem.link || menuItem.label)"
                                        @touch-end="helpMenuState = false"
                                    >
                                        <q-item-section avatar>
                                            <q-icon :name="menuItem.icon" />
                                        </q-item-section>
                                        <q-item-section>
                                            {{ menuItem.label }}
                                        </q-item-section>
                                    </q-item>
                                </template>

                                <q-separator inset spaced />
                            </template>
                            <q-item-label header class="non-selectable">Help</q-item-label>
                            <q-item v-for="(menuItem, index) in helpMenu" :key="index"
                                clickable
                                v-ripple
                                class="non-selectable"
                                @click="menuItem.action ? menuItem.action() : openUrl(menuItem.link)"
                            >
                                <q-item-section avatar dense>
                                    <q-icon :name="menuItem.icon" />
                                </q-item-section>
                                <q-item-section>
                                    {{ menuItem.label }}
                                </q-item-section>
                            </q-item>
                            <q-separator inset spaced />
                            <q-item-label header class="non-selectable">Status</q-item-label>
                            <q-item class="non-selectable">
                                <q-item-section>
                                    <q-item-label>Domain</q-item-label>
                                    <q-item-label caption>{{ getDomainServerState }}</q-item-label>
                                    <q-item-label
                                        caption
                                        class="row"
                                        style="align-items: center;"
                                        :title="getLocation"
                                    >
                                        <p class="q-ma-none text-no-wrap ellipsis" style="max-width: 300px;">
                                            {{ getLocation }}
                                        </p>
                                        <q-btn
                                            flat
                                            round
                                            dense
                                            :icon="domainLocationCopied ? 'done' : 'content_copy'"
                                            :disable="domainLocationCopied"
                                            class="q-ml-sm"
                                            title="Copy"
                                            @click.stop="copyDomainLocationToClipboard()"
                                        />
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-item class="non-selectable">
                                <q-item-section>
                                    <q-item-label>{{ applicationStore.theme.globalServiceTerm }}</q-item-label>
                                    <q-item-label caption>{{ getMetaverseServerState.toUpperCase() }}</q-item-label>
                                    <q-item-label
                                        caption
                                        class="row"
                                        style="align-items: center;"
                                        :title="getMetaverseServerLocation"
                                    >
                                        <p class="q-ma-none text-no-wrap ellipsis" style="max-width: 300px;">
                                            {{ getMetaverseServerLocation }}
                                        </p>
                                        <q-btn
                                            flat
                                            round
                                            dense
                                            :icon="metaverseLocationCopied ? 'done' : 'content_copy'"
                                            :disable="metaverseLocationCopied"
                                            class="q-ml-sm"
                                            title="Copy"
                                            @click.stop="copyMetaverseLocationToClipboard()"
                                        />
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-separator inset spaced />
                            <q-item-label header class="non-selectable">About</q-item-label>
                            <q-item>
                                <q-item-section>
                                    <q-item-label>{{ applicationStore.globalConsts.APP_NAME }}</q-item-label>
                                    <q-item-label caption>{{ applicationStore.globalConsts.APP_VERSION_TAG }}</q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-item>
                                <q-item-section>
                                    <q-item-label>Vircadia Web SDK</q-item-label>
                                    <q-item-label caption>{{ applicationStore.globalConsts.SDK_VERSION_TAG }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
                </q-toolbar>
            </div>
        </q-header>

        <q-page-container class="full-height">
            <MainScene
                :interactive="!aMenuIsOpen"
                @click.prevent="hideSettingsAndHelpMenus()"
                @joint-conference-room="joinConferenceRoom($event)"
            >
                <template v-slot:manager>
                    <OverlayManager ref="OverlayManager" />
                </template>
            </MainScene>
        </q-page-container>

        <q-dialog v-model="getDialogState">
            <q-card
                class="column no-wrap items-stretch"
                style="width: 310px;"
            >
                <component @closeDialog='closeDialog' :is="applicationStore.dialog.which + 'Dialog'"></component>
            </q-card>
        </q-dialog>

    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { openURL } from "quasar";
import { applicationStore, userStore } from "@Stores/index";
import { type JitsiRoomInfo } from "@Stores/application-store";
import { Utility } from "@Modules/utility";
import { Account, type onAttributeChangePayload } from "@Modules/account";
import { AudioMgr } from "@Modules/scene/audio";
import { AudioIO } from "@Modules/ui/audioIO";
import Log from "@Modules/debugging/log";
// Components
import MainScene from "@Components/MainScene.vue";
import OverlayManager from "@Components/overlays/OverlayManager.vue";

type ComponentTemplateRefs = {
    OverlayManager: typeof OverlayManager.methods
};

export default defineComponent({
    name: "MainLayout",

    components: {
        MainScene,
        OverlayManager
    },

    setup() {
        return {
            applicationStore,
            userStore
        };
    },

    data() {
        return {
            mobileBreakpoint: 800,
            isDesktop: true,
            isMobile: false,
            // Toolbar
            micMenuState: false,
            AudioIOInstance: new AudioIO(),
            locationInput: "",
            settingsMenu: [
                {
                    icon: "headphones",
                    label: "Audio",
                    link: "",
                    isCategory: false,
                    separator: true
                },
                {
                    icon: "gamepad",
                    label: "Controls",
                    link: "",
                    isCategory: false,
                    separator: true
                },
                {
                    icon: "desktop_windows",
                    label: "Graphics",
                    link: "",
                    isCategory: false,
                    separator: true
                },
                {
                    icon: "badge",
                    label: "Nametags",
                    action: () => {
                        userStore.avatar.showNametags = !userStore.avatar.showNametags;
                        Log.info(Log.types.OTHER, "Toggle Avatar Nametags");
                    },
                    isCategory: false,
                    separator: true,
                    caption: "nametag_setting"
                },
                {
                    icon: "lightbulb",
                    label: "Light / Dark",
                    action: () => {
                        this.$q.dark.toggle();
                        Log.info(Log.types.OTHER, "Toggle Dark");
                    },
                    isCategory: false,
                    separator: false
                }
            ],
            settingsMenuState: false,
            helpMenu: [
                {
                    icon: "chat",
                    label: "Discord",
                    link: "https://discord.com/invite/Pvx2vke"
                },
                {
                    icon: "forum",
                    label: "Forum",
                    link: "https://forum.vircadia.com/"
                },
                {
                    icon: "support",
                    label: "User Documentation",
                    link: "https://docs.vircadia.com/"
                },
                {
                    icon: "delete_sweep",
                    label: "Clear All Settings",
                    action: () => {
                        userStore.reset();
                        window.location.reload();
                    }
                }
            ],
            helpMenuState: false,
            aMenuIsOpen: false,
            lastConnectedDomain: undefined as string | undefined,
            domainLocationCopied: false,
            metaverseLocationCopied: false
        };
    },

    computed: {
        getDialogState: {
            get(): boolean {
                return this.applicationStore.dialog.show;
            },
            set(newValue: boolean) {
                this.setDialogState(newValue);
            }
        },

        getLocation: function(): string {
            return this.userStore.avatar.location ?? "Not currently connected to a domain.";
        },

        // Displays the state of the domain server on the user interface
        getDomainServerState: function(): string {
            return this.applicationStore.domain.connectionState ?? "DISCONNECTED";
        },
        getMetaverseServerState: function(): string {
            return this.applicationStore.metaverse.connectionState;
        },
        getMetaverseServerLocation: function(): string {
            return this.applicationStore.metaverse.server ?? "Not currently connected to a metaverse server.";
        },
        getProfilePicture: function(): string | undefined {
            return this.userStore.account.images?.thumbnail;
        },

        headerStyle: function(): string {
            // Style the header bar based on the Theme config.
            if (this.applicationStore.theme.globalStyle === "none") {
                return "unset";
            }
            const opacities = {
                "aero": "5c",
                "mica": "30"
            };
            if (this.applicationStore.theme.headerStyle === "none") {
                return "unset";
            }
            const gradients = {
                "gradient-left": "circle at 0% 50%",
                "gradient-right": "circle at 100% 50%"
            };
            const gradient = gradients[this.applicationStore.theme.headerStyle];
            const primary = this.applicationStore.theme.colors.primary;
            const secondary = this.applicationStore.theme.colors.secondary;
            const end = this.$q.dark.isActive ? "#121212" : "#ffffff";
            const opacity = opacities[this.applicationStore.theme.globalStyle];
            return `radial-gradient(${gradient}, ${secondary}${opacity} 15%, ${primary}${opacity} 40%, ${end}${opacity} 95%)`;
        },

        microphoneColor: function(): string {
            if (!this.applicationStore.audio.user.hasInputAccess) {
                return "grey-6";
            }
            if (this.applicationStore.audio.user.muted) {
                return "red";
            }
            return "primary";
        }
    },
    methods: {
        setDialogState: function(newValue: boolean) {
            this.applicationStore.dialog.show = newValue;
        },
        // Drawers
        toggleUserMenu: function(): void {
            (this.$refs as ComponentTemplateRefs).OverlayManager?.toggleOverlay("Menu");
        },
        // Settings & Help menus clickaway
        hideSettingsAndHelpMenus: function(): void {
            if (this.aMenuIsOpen) {
                this.aMenuIsOpen = false;
                this.settingsMenuState = false;
                this.helpMenuState = false;
            }
        },

        // Pressed "connect"
        // Connect to the specified domain-server and the associated metaverse-server
        // Also add state update links to keep the Vuex state variables up to date.
        connect: async function() {
            await this.connectToAddress(this.locationInput);
        },
        connectToAddress: async function(locationAddress: string) {
            Log.info(Log.types.UI, `Connecting to... ${locationAddress}`);
            await Utility.connectionSetup(locationAddress);
        },

        disconnect: async function() {
            Log.info(Log.types.UI, `Disconnecting from... ${this.userStore.avatar.location}`);
            this.lastConnectedDomain = this.userStore.avatar.location;
            await Utility.disconnectActiveDomain();
        },

        // Metaverse

        logout: function() {
            Account.logout();
            this.$q.notify({
                type: "positive",
                textColor: "white",
                icon: "cloud_done",
                message: "Logged out."
            });
        },

        // Dialog Handling
        openDialog: function(pWhich: string, shouldShow: boolean) {
            this.applicationStore.dialog.show = shouldShow;
            this.applicationStore.dialog.which = pWhich;
        },
        closeDialog: function() {
            this.applicationStore.dialog.show = false;
            this.applicationStore.dialog.which = "";
        },

        onClickOpenOverlay: function(pOverlay: string) {
            (this.$refs as ComponentTemplateRefs).OverlayManager?.openOverlay(pOverlay);
        },
        joinConferenceRoom: function(room: JitsiRoomInfo) {
            this.applicationStore.joinConferenceRoom(room);
            (this.$refs as ComponentTemplateRefs).OverlayManager?.toggleOverlay("Jitsi");
        },
        openUrl: function(pUrl: string) {
            openURL(pUrl);
        },
        toggleMicrophoneMute: function() {
            if (this.applicationStore.audio.user.hasInputAccess) {
                AudioMgr.muteAudio();
            }
        },
        async copyDomainLocationToClipboard(): Promise<void> {
            this.domainLocationCopied = true;
            await navigator.clipboard.writeText(this.getLocation);
            const transitionTime = 1700;
            window.setTimeout(() => {
                this.domainLocationCopied = false;
            }, transitionTime);
        },
        async copyMetaverseLocationToClipboard(): Promise<void> {
            this.metaverseLocationCopied = true;
            await navigator.clipboard.writeText(this.getMetaverseServerLocation);
            const transitionTime = 1700;
            window.setTimeout(() => {
                this.metaverseLocationCopied = false;
            }, transitionTime);
        },
        formatMenuItemCaption: function(caption: string) {
            switch (caption) {
                case "nametag_setting":
                    return this.userStore.avatar.showNametags ? "On" : "Off";
                default:
                    return caption;
            }
        }
    },
    beforeMount: function() {
        // Ensure that Quasar's global color variables are in sync with the Store's theme colors.
        document.documentElement.style.setProperty("--q-primary", this.applicationStore.theme.colors.primary ?? null);
        document.documentElement.style.setProperty("--q-secondary", this.applicationStore.theme.colors.secondary ?? null);
        document.documentElement.style.setProperty("--q-accent", this.applicationStore.theme.colors.accent ?? null);
    },
    mounted: function() {
        // Set the isDesktop and isMobile flags according to the window's width.
        this.isMobile = window.innerWidth < this.mobileBreakpoint;
        this.isDesktop = !this.isMobile;
        window.addEventListener("resize", () => {
            this.isMobile = window.innerWidth < this.mobileBreakpoint;
            this.isDesktop = !this.isMobile;
        });

        Account.onAttributeChange.connect((pPayload: onAttributeChangePayload) => {
            this.userStore.updateAccountInfo(pPayload);
        });

        if (this.isDesktop) {
            (this.$refs as ComponentTemplateRefs).OverlayManager?.openOverlay("Menu");
            (this.$refs as ComponentTemplateRefs).OverlayManager?.openOverlay("Chat");
        }

        // Set up event listeners for UI-based controls.
        window.addEventListener("keydown", (event) => {
            const target = event.target as HTMLElement;
            if (
                target?.tagName !== "INPUT"
                && target?.tagName !== "TEXTAREA"
            ) {
                // Toggle the menu.
                if (event.code === this.userStore.controls.keyboard.other.toggleMenu?.keycode) {
                    (this.$refs as ComponentTemplateRefs).OverlayManager?.toggleOverlay("Menu");
                }
                // Open the chat.
                if (event.code === this.userStore.controls.keyboard.other.openChat?.keycode) {
                    (this.$refs as ComponentTemplateRefs).OverlayManager?.toggleOverlay("Chat");
                }
            }
        });
    }
});
</script>
