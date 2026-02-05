use tauri_plugin_notification::NotificationExt;

#[tauri::command]
fn send_jira_notification(app: tauri::AppHandle, title: String, body: String) {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .unwrap();
}

#[tauri::command]
fn save_token(service: String, user: String, token: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_token(service: String, user: String) -> Result<String, String> {
    let entry = keyring::Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_token(service: String, user: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &user).map_err(|e| e.to_string())?;
    entry.delete_password().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--silent"]),
        ))
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::init())
        .setup(|app| {
            use tauri::Manager;
            use tauri::tray::{TrayIconBuilder, TrayIconEvent};
            use tauri::menu::{Menu, MenuItem};

            let show_i = MenuItem::with_id(app, "show", "Göster", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                   if let TrayIconEvent::Click { .. } = event {
                       let app = tray.app_handle();
                       if let Some(window) = app.get_webview_window("main") {
                           let _ = window.show();
                           let _ = window.set_focus();
                       }
                   }
                })
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            Ok(())
        })
        // Pencereyi kapat isteğinde gerçekten çıkmak yerine gizle, tray'den yönetilsin
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Err(err) = window.hide() {
                    eprintln!("Failed to hide window: {err}");
                }
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            send_jira_notification,
            save_token,
            get_token,
            delete_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
