﻿/// <reference path="include/interfaces.d.ts" />

// Electron patch scope.
var Patch: any;
((root: any, Patch) => {

    var _apply = () => {
        var _require = root.require;
        root.require = (...args: any[]): any => {
            if (0 < args.length && args[0] instanceof Array) {
                return requirejs.apply(root, args);
            } else {
                return _require.apply(root, args);
            }
        };
    };

    Patch.apply = _apply;

})(this, Patch || (Patch = {}));

module Garage {
	var setup = (callback: Function): void => {
		Patch.apply();
		var global = global || window;

		//このアプリのバージョン :　MajorVersion.MinorVersion.BuildNumber.Reversion
		APP_VERSION = "1.0.0.07060";

		fs = require("fs-extra");
        path = require("path");

        Remote = require("electron").remote;
        app = require("electron").remote.app;
        Menu = require("electron").remote.Menu;
        MenuItem = require("electron").remote.MenuItem;

		HUIS_FACE_PAGE_WIDTH = 480;
		HUIS_FACE_PAGE_HEIGHT = 812;
		MAX_HUIS_FILES = 30;
		HUIS_VID = 0x054C;
		HUIS_PID = 0x0B94;
		// Garage のファイルのルートパス設定 (%APPDATA%\Garage)
		GARAGE_FILES_ROOT = path.join(app.getPath("appData"), "Garage").replace(/\\/g, "/");
		// HUIS File のルートパス設定 (%APPDATA%\Garage\HuisFiles)
		HUIS_FILES_ROOT = path.join(GARAGE_FILES_ROOT, "HuisFiles").replace(/\\/g, "/");
		if (!fs.existsSync(HUIS_FILES_ROOT)) {
			fs.mkdirSync(HUIS_FILES_ROOT);
		}
		// HUIS File ディレクトリーにある画像ディレクトリーのパス設定 (%APPDATA%\Garage\HuisFiles\remoteimages)
		HUIS_REMOTEIMAGES_ROOT = path.join(HUIS_FILES_ROOT, "remoteimages").replace(/\\/g, "/");

		// ページの背景の起点座標とサイズ
		HUIS_PAGE_BACKGROUND_AREA = {
			x: -30,
			y: -24,
			w: 540,
			h: 870
		};

		// 画像追加時の画像編集パラメーター
		IMAGE_EDIT_PARAMS = {
			resize: {
				width: HUIS_FACE_PAGE_WIDTH,
				height: HUIS_FACE_PAGE_HEIGHT
			},
			grayscale: 1,
			imageType: "image/png"
		};
		// 背景画像設定時の画像編集パラメーター
		IMAGE_EDIT_PAGE_BACKGROUND_PARAMS = {
			resize: {
				width: HUIS_PAGE_BACKGROUND_AREA.w,
				height: HUIS_PAGE_BACKGROUND_AREA.h
			},
			grayscale: 1,
			imageType: "image/png"
        };

        HELP_SITE_URL = "http://rd1.sony.net/help/remote/ui_creator/ja/";

        if (fs.existsSync("debug")) {
            DEBUG_MODE = true;
            console.warn("DEBUG_MODE enabled");
        } else {
            DEBUG_MODE = false;
        }

		callback();
	};

	var loadUtils = (callback: Function): void => {
		// Util のロードと初期化
		requirejs(["garage.model.offscreeneditor", "garage.util.huisfiles", "garage.util.electrondialog", "garage.util.huisdev", "garage.util.miscutil", "garage.util.garagefiles", "garage.util.jqutils"], () => {
			electronDialog = new Util.ElectronDialog();
			huisFiles = new Util.HuisFiles();
			garageFiles = new Util.GarageFiles();
			miscUtil = new Util.MiscUtil();
			callback();
		});
	};

	// 起動時のチェック
	var initCheck = (callback?: Function) => {
		HUIS_ROOT_PATH = null;
		while (!HUIS_ROOT_PATH) {
			HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
            if (HUIS_ROOT_PATH) { // HUISデバイスが接続されている
                let dirs = null;
                while (dirs == null) {
                    try {
                        dirs = fs.readdirSync(HUIS_ROOT_PATH); //HUIS_ROOT_PATHの読み込みにトライ
                    } catch (e) { // 「パソコンと接続」が押されておらずディレクトリが読めなかった
                        console.error("HUIS must change the mode: HUIS_ROOT_PATH=" + HUIS_ROOT_PATH);
                        let response = electronDialog.showMessageBox(
                            {
                                type: "info",
                                message: "HUIS の画面の「パソコンと接続」をクリックしてください。\n"
                                + "[キャンセル] ボタンを押すとアプリケーションは終了します。",
                                buttons: ["ok", "cancel"]
                            });

                        if (response !== 0) {
                            app.exit(0);
                        }
                    }
                }
                isHUISConnected = true; // HUISが接続されている
                callback(); // 次の処理へ

			} else {
				// HUISデバイスが接続されていない場合は、接続を促すダイアログを出す
				let response = electronDialog.showMessageBox(
					{
						type: "info",
						message: "HUIS が PC に接続されていません。\n"
						+ "HUIS を PC と接続し「パソコンと接続」をクリックし [OK] ボタンを押してください。\n"
						+ "[キャンセル] ボタンを押すとアプリケーションは終了します。",
						buttons: ["ok", "cancel"]
                    });

				if (response !== 0) {
					app.exit(0);
				}
			}
		}
	};

	setup(() => {
		requirejs(["cdp.framework.jqm"], () => {
			CDP.Framework.initialize().done(() => {
				loadUtils(() => {
					requirejs(["app"], (app: any) => {
						initCheck(() => {
							app.main();
						});
					});
				});
			});
		});
	});
}
