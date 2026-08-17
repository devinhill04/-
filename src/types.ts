export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebAppTheme {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
}

export interface AppConfig {
  isTelegram: boolean;
  user: TelegramUser;
  platform: string;
  colorScheme: 'dark' | 'light';
  themeParams: Partial<TelegramWebAppTheme>;
}
