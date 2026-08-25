export interface CategoryConfig {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "basics",
    title: "Основы и правила",
    description: "Базовые гайды, правила и чек-листы для любого этапа",
    iconName: "BookOpen"
  },
  {
    id: "invest",
    title: "Инвестидеи и разборы",
    description: "Анализ акций, облигаций, сырьевых секторов и отчетов",
    iconName: "TrendingUp"
  },
  {
    id: "useful",
    title: "Полезное и инструменты",
    description: "Налоговые вычеты, ИИС, лайфхаки и личные финансы",
    iconName: "Bookmark"
  }
];
