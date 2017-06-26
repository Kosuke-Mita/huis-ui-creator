﻿/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/// <reference path="../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PropertyAreaElement] ";

        namespace constValue {
            export const TEMPLATE_FILE_PATH: string = CDP.Framework.toUrl("/templates/item-detail.html");
        }

        export namespace OriginalEvents {
            export const UI_CHANGE_SIZE :string = "uiChange:size";
        }

        export abstract class PropertyAreaElement extends Backbone.View<Model.Item> {

            protected template_: CDP.Tools.JST;

            constructor(item: Model.Item, templateDomId: string, options?: Backbone.ViewOptions<Model.Item>) {
                super({
                    model: item,
                });
                this.template_ = CDP.Tools.Template.getJST(templateDomId, this._getTemplateFilePath());
            }

            render(option?: any): Backbone.View<Model.Item> {
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_(this.getModel()));
                return this;
            }

            endProcessOfRender() {
                this.$el.i18n();
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
            }

            /**
             * 保持しているモデルを取得する
             * @return {Model.BUttonItem}
             */
            getModel(): Model.Item {
                return this.model;
            }

            /**
             * テンプレート用の.htmlへのファイルパスを返す。
             * @return {string}
             */
            protected _getTemplateFilePath() {
                return constValue.TEMPLATE_FILE_PATH;
            }

            /**
             * プルダウンにJQueryMobileのスタイルを適応する。
             * JQueryMobileのスタイルは、新たに生成したDOM要素には自動的には適応されないため、
             * プルダウンをレンダリングした後に、この関数を利用する。
             * ただし、重たい処理なので、全てプルダウンをレンダリングした後に1度だけ呼ぶこと。
             * @param {JQuery} $target プルダウンを内包しているDOMのJQuery
             */
            protected _adaptJqueryMobileStyleToPulldown($target: JQuery) {
                let pulldownContainerDomClass = ".custom-select";
                $target.find(pulldownContainerDomClass).trigger('create');
            }

        }
    }
}
