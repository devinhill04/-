export interface AdBannerConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  bgImageUrl: string;
  badge?: string;
}

export const AD_BANNER: AdBannerConfig = {
  title: "Подписка IF+",
  subtitle: "Эксклюзивная аналитика, инвест-идеи и приватные разборы от InvestFuture",
  buttonText: "Перейти в IF+",
  url: "https://t.me/plus_investfuture",
  bgImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  badge: "IF+"
};
