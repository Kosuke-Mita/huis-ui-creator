﻿/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {

        const TAG: string = "[Garage.Model.Face] ";

        export class Face extends Backbone.Model implements IGFace {

            constructor(remoteId: string, name: string, category: string, modules?: Model.Module[], attributes?: any, options?: any) {
                super(attributes, options);

                this.modules = [];
                if (modules != null) {
                    this.modules = modules;
                }

                this.remoteId = remoteId;
                this.name = name;
                this.category = category;
            }

            public convertToFullCustomFace() {

                let convertedModules: Model.Module[] = [];
                let pageIndex = 0;

                let emptyModuleArea = {
                    x: 0,
                    y: 0,
                    w: HUIS_FACE_PAGE_WIDTH,
                    h: 0,
                }

                let module = new Model.Module();
                module.setInfo(this.remoteId, pageIndex, emptyModuleArea);

                let prevElem;
                for (let elem of this.modules) {
                    let isCrossPage = module.area.h + elem.area.h > HUIS_FACE_PAGE_HEIGHT;
                    if (isCrossPage) {
                        convertedModules.push(module);
                        pageIndex++;
                        module = new Model.Module();
                        module.setInfo(this.remoteId, pageIndex, emptyModuleArea);
                    }
                    if (isCrossPage || this.isSeparatorNeeded(prevElem, elem)) {
                        let moduleSeparator = new Model.ModuleSeparator(elem.group.name);
                        moduleSeparator.insertTo(elem);
                    }
                    module.merge(elem);
                    prevElem = elem;
                }
                convertedModules.push(module);

                this.modules = convertedModules;
                return this;
            }

            public isSeparatorNeeded(prevItem: Model.Module, currentItem: Model.Module): boolean {
                if (currentItem == null) {
                    console.warn(TAG + "currentItem is null, skip moduleSeparator");
                    return false;
                }

                if (this.category !== "Custom") {
                    return false;
                }

                if (prevItem == null) {
                    // First module of "custom" face
                    return true;
                } else {
                    if (prevItem.group == null) {
                        // Just null check
                        return false;
                    }
                    if (prevItem.group.name !== currentItem.group.name
                        || prevItem.group.original_remote_id !== currentItem.group.original_remote_id) {
                        // currentItem is different from prevItem
                        return true;
                    }
                    if (prevItem.get("pageIndex") !== currentItem.get("pageIndex")) {
                        // cross page border
                        return true;
                    }
                }

                return false;
            }

            setWholeRemoteId(val: string) {
                this.remoteId = val;
                for (let elem of this.modules) {
                    elem.remoteId = val;
                }
            }

            get remoteId() {
                return this.get("remoteId");
            }

            set remoteId(val) {
                this.set("remoteId", val);
            }

            get name() {
                return this.get("name");
            }

            set name(val) {
                this.set("name", val);
            }

            get category() {
                return this.get("category");
            }

            set category(val) {
                this.set("category", val);
            }

            get modules(): Model.Module[] {
                return this.get("modules");
            }

            set modules(val) {
                this.set("modules", val);
            }

            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["remoteId", "name", "category", "modules"];
            }

        }
    }
}