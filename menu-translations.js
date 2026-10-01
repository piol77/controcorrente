const CONTROCORRENTE_MENU = {
  en: {
    title: "Dinner Menu",
    subtitle: "Controcorrente · Seafood cuisine",
    courses: [
      { title: "Starters", dishes: [
        ["Smoked Salmon Bruschetta", "Toasted bread, smoked salmon, cream cheese, rocket and capers. (1, 4, 7)", "€ 10,00"],
        ["Shrimp Cocktail", "Shrimp* with our delicate cocktail sauce, served on fresh lettuce. (2, 3, 10)", "€ 10,00"],
        ["Fried Button Mushrooms", "Fresh button mushrooms, fried until golden and served with lemon. (1)", "€ 10,00"]
      ]},
      { title: "First Courses", dishes: [
        ["Seafood Spaghetti", "Mussels, clams, shrimp*, king prawn* and a light tomato sauce. (1, 2, 14)", "€ 15,00"],
        ["Conchigliette with Vegetables, Saffron and Crispy Guanciale", "Seasonal vegetables, saffron and crispy cured pork cheek. (1, 7, 9)", "€ 12,50"],
        ["Beetroot and Gorgonzola Risotto (minimum two portions)", "Creamy beetroot risotto with gorgonzola and walnuts. (7, 8, 9)", "€ 12,50"],
        ["Linguine with Courgette Cream, Avocado and Shrimp", "With shrimp*, lemon and a touch of tomato. (1, 2, 7)", "€ 12,50"]
      ]},
      { title: "Main Courses", dishes: [
        ["Mixed Fried Anchovies, Calamari and Shrimp", "Light, crispy mixed seafood fry with shrimp*. (1, 2, 4, 14)", "€ 20,00"],
        ["Pork Tenderloin with Bacon and Figs", "Bacon-wrapped pork tenderloin with figs and roasted potatoes.", "€ 14,00"],
        ["Sea Bass Fillet with Lemon", "Grilled sea bass with lemon and parsley, served with raw red cabbage. (4)", "€ 14,00"],
        ["Salmon Steak with Orange and Pink Peppercorns", "Grilled salmon with orange and pink peppercorns, served with raw fennel and balsamic vinegar. (4)", "€ 14,00"]
      ]}
    ],
    dailyTitle: "Today's Dinner Offers · €10 each",
    daily: [
      ["Starter · Beef Tartare with Lemon and Grana", "(7)", "€ 10,00"],
      ["Main Course · Octopus, Shrimp* and Potatoes", "(2, 14)", "€ 10,00"],
      ["First Course · Stir-fried Rice with Chicken, Shrimp*, Vegetables and Spices", "(2, 6)", "€ 10,00"]
    ],
    note: "Please tell us about any allergies before ordering · * Ingredients frozen at source"
  },
  zh: {
    title: "晚餐菜单",
    subtitle: "Controcorrente · 海鲜料理",
    courses: [
      { title: "前菜", dishes: [
        ["烟熏三文鱼烤面包", "烤面包、烟熏三文鱼、奶油奶酪、芝麻菜和刺山柑。(1, 4, 7)", "€ 10,00"],
        ["玫瑰酱小虾", "小虾仁*配本店特制玫瑰酱，佐新鲜生菜。(2, 3, 10)", "€ 10,00"],
        ["炸口蘑", "新鲜口蘑炸至金黄，配柠檬。(1)", "€ 10,00"]
      ]},
      { title: "第一道主食", dishes: [
        ["海鲜意大利面", "淡菜、蛤蜊、小虾仁*、大虾*和少量番茄酱。(1, 2, 14)", "€ 15,00"],
        ["蔬菜藏红花贝壳面配香脆风干猪颊肉", "时令蔬菜、藏红花和香脆风干猪颊肉。(1, 7, 9)", "€ 12,50"],
        ["甜菜根戈贡佐拉奶酪烩饭（至少两份）", "甜菜根烩饭，配戈贡佐拉奶酪和核桃。(7, 8, 9)", "€ 12,50"],
        ["西葫芦牛油果小虾扁意面", "西葫芦酱、牛油果、小虾仁*、柠檬和少量番茄。(1, 2, 7)", "€ 12,50"]
      ]},
      { title: "主菜", dishes: [
        ["炸凤尾鱼、鱿鱼和小虾拼盘", "轻盈酥脆的海鲜炸物，含小虾仁*。(1, 2, 4, 14)", "€ 20,00"],
        ["培根无花果猪里脊", "培根包裹猪里脊，配无花果和烤土豆。", "€ 14,00"],
        ["柠檬海鲈鱼柳", "烤海鲈鱼柳配柠檬和欧芹，佐生紫甘蓝。(4)", "€ 14,00"],
        ["橙香粉红胡椒三文鱼排", "烤三文鱼配橙子和粉红胡椒，佐生茴香和意大利黑醋。(4)", "€ 14,00"]
      ]}
    ],
    dailyTitle: "今日晚餐优惠 · 每道10欧元",
    daily: [
      ["前菜 · 柠檬帕玛森奶酪生牛肉", "(7)", "€ 10,00"],
      ["主菜 · 章鱼、小虾仁*和土豆", "(2, 14)", "€ 10,00"],
      ["第一道主食 · 鸡肉小虾仁*蔬菜香料炒饭", "(2, 6)", "€ 10,00"]
    ],
    note: "点餐前请告知过敏情况 · * 原产地冷冻食材"
  }
};

function renderTranslatedMenu() {
  const root = document.querySelector("[data-menu-language]");
  if (!root) return;
  const language = root.dataset.menuLanguage;
  const menu = CONTROCORRENTE_MENU[language];
  root.querySelector("h1").textContent = menu.title;
  root.querySelector(".language-head p").textContent = menu.subtitle;
  const content = root.querySelector(".translated-menu-content");
  [...menu.courses, { title: menu.dailyTitle, dishes: menu.daily, daily: true }].forEach(course => {
    const section = document.createElement("section");
    section.className = course.daily ? "language-course language-daily" : "language-course";
    const heading = document.createElement("h2");
    heading.textContent = course.title;
    section.appendChild(heading);
    course.dishes.forEach(([name, description, price]) => {
      const article = document.createElement("article");
      article.className = "language-dish";
      const title = document.createElement("h3");
      title.textContent = name;
      if (price) {
        const amount = document.createElement("span");
        amount.className = "language-price";
        amount.textContent = price;
        title.appendChild(amount);
      }
      const text = document.createElement("p");
      text.textContent = description;
      article.append(title, text);
      section.appendChild(article);
    });
    content.appendChild(section);
  });
  root.querySelector(".language-note").textContent = menu.note;
}

document.addEventListener("DOMContentLoaded", renderTranslatedMenu);
