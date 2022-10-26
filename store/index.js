import { v4 as uuidv4 } from "uuid";

export const state = () => ({
  projectsHeading: "Projects",
  projectsDescription: "Alguns dos projetos que completei com sucesso",
  projects: [
    {
      id: "74a7911d-5bf1-454c-b8ee-e0fcaa8a0381",
      title: "Solar Car",
      category: "AutomotiveAnos de experiência",
      img: "images/feedget-project-1.jpg",
      publishDate: "06 de Maio, 2022",
      tag: "UI / Mobile / Web",
      clientTitle: "Sobre o Projeto",
      objectivesTitle: "Objective",
      objectivesDetails:
        `O objetivo do projeto é ser um widget onde o usuário poderá enviar feedbacks.`,
      techTitle: "Ferramentas & Tecnologias",
      detailsTitle: "Projeto",
      socialTitle: "Se conecte comigo",
      projectImages: [
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-1.jpg",
        },
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-2.jpg",
        },
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-3.jpg",
        },
      ],
      companyInfos: [
        {
          id: uuidv4(),
          title: "Nome da Empresa",
          details: "RocketSeat",
        },
        {
          id: uuidv4(),
          title: "Aprendizado",
          details: "UI Design & Desenvolvimento de Frontend",
        },
        {
          id: uuidv4(),
          title: "Website",
          details: "https://feedback-widget-web-theta.vercel.app/",
        },
      ],
      technologies: [
        "React",
        "CSS",
        "Phosphor-react (para os ícones)",
        "TailwindCSS com PostCSS",
        "Typescript",
        "Figma",
        "Vite",
      ],
      projectDetails: [
        {
          id: uuidv4(),
          details:
            "Este projeto foi pensado para ser algo 'Simples', mas que me ajude a estudar reactJS, reactNative (vou fazer a versão mobile) e nodeJS - se preocupando com a acessibilidade.",
        },
        {
          id: uuidv4(),
          details:
            "O objetivo do projeto é ser um widget onde o usuário poderá enviar feedback, seja um bug, uma ideia de melhoria ou qualquer outro feedback que não se enquadre nessas outras duas categorias, além disso, o usuário terá a opção de inserir uma imagem da tela, mas este não terá que tirar um print, já que ao clicar no botão o print é feito automaticamente e aplicada no feedback. ",
        },
        {
          id: uuidv4(),
          details:
            "Ao enviar esse feedback, ele é inserido em um banco de dados e enviado por e-mail aos desenvolvedores.",
        },
      ],
      socialSharings: [
        {
          id: uuidv4(),
          name: "Linkedin",
          icon: "linkedin",
          url: "https://www.linkedin.com/in/jason-royan-111180237/",
        },
        {
          id: uuidv4(),
          name: "Instagram",
          icon: "instagram",
          url: "https://www.instagram.com/royanjason/",
        },
        {
          id: uuidv4(),
          name: "Github",
          icon: "github",
          url: "https://github.com/JasonRoyan",
        },
      ],
    },
    {
      id: "123412213-5bf1-454c-b8ee-e0fcaa8a0381",
      title: "FeedbackWidget",
      category: "Web Application",
      img: "images/feedget-project-1.jpg",
      publishDate: "06 de Maio, 2022",
      tag: "UI / Mobile / Web",
      clientTitle: "Sobre o Projeto",
      objectivesTitle: "Objective",
      objectivesDetails:
        `O objetivo do projeto é ser um widget onde o usuário poderá enviar feedbacks.`,
      techTitle: "Ferramentas & Tecnologias",
      detailsTitle: "Projeto",
      socialTitle: "Se conecte comigo",
      projectImages: [
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-1.jpg",
        },
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-2.jpg",
        },
        {
          id: uuidv4(),
          title: "Feedback Widget",
          img: "../images/feedget-project-3.jpg",
        },
      ],
      companyInfos: [
        {
          id: uuidv4(),
          title: "Nome da Empresa",
          details: "RocketSeat",
        },
        {
          id: uuidv4(),
          title: "Aprendizado",
          details: "UI Design & Desenvolvimento de Frontend",
        },
        {
          id: uuidv4(),
          title: "Website",
          details: "https://feedback-widget-web-theta.vercel.app/",
        },
      ],
      technologies: [
        "React",
        "CSS",
        "Phosphor-react (para os ícones)",
        "TailwindCSS com PostCSS",
        "Typescript",
        "Figma",
        "Vite",
      ],
      projectDetails: [
        {
          id: uuidv4(),
          details:
            "Este projeto foi pensado para ser algo 'Simples', mas que me ajude a estudar reactJS, reactNative (vou fazer a versão mobile) e nodeJS - se preocupando com a acessibilidade.",
        },
        {
          id: uuidv4(),
          details:
            "O objetivo do projeto é ser um widget onde o usuário poderá enviar feedback, seja um bug, uma ideia de melhoria ou qualquer outro feedback que não se enquadre nessas outras duas categorias, além disso, o usuário terá a opção de inserir uma imagem da tela, mas este não terá que tirar um print, já que ao clicar no botão o print é feito automaticamente e aplicada no feedback. ",
        },
        {
          id: uuidv4(),
          details:
            "Ao enviar esse feedback, ele é inserido em um banco de dados e enviado por e-mail aos desenvolvedores.",
        },
      ],
      socialSharings: [
        {
          id: uuidv4(),
          name: "Linkedin",
          icon: "linkedin",
          url: "https://www.linkedin.com/in/jason-royan-111180237/",
        },
        {
          id: uuidv4(),
          name: "Instagram",
          icon: "instagram",
          url: "https://www.instagram.com/royanjason/",
        },
        {
          id: uuidv4(),
          name: "Github",
          icon: "github",
          url: "https://github.com/JasonRoyan",
        },
      ],
    },
  ],
  aboutMe: [
    {
      id: uuidv4(),
      bio: "Meu nome é Carolina Teixeira Coelho, tenho 19 anos e sou Técnica em Administração de Empresas pela Escola do SEBRAE, hoje em dia não faço faculdade."
    },
    {
      id: uuidv4(),
      bio: "Sou uma desenvolvedora web e estou estudando desenvolvimento mobile. Tive meu primeiro contato com programação aos 12 anos e após 4 anos de estudo entrei como monitora em uma escola de programação para crianças. Trabalho como desenvolvedora desde o final de 2019. Tenho experiência em Javascript, Node.js, React, Bancos Relacionais (MySql e Postgres) e Não relacionais (MongoDB).",
    },
    {
      id: uuidv4(),
      bio: "Atualmente estou focada em minha carreira de desenvolvedora fullstack e como sempre AMEI compartilhar algumas coisas que estou aprendendo, publico artigos no Linkedin com algumas dicas e reflexões sobre o mundo da tecnologia.",
    },
    {
      id: uuidv4(),
      bio: "Sou fascinada em tudo o que ainda não conheço. Novos modelos de negócio, estilos de colaboração, linguagens de programação, pessoas, culturas e ambientes... Gosto de mudança, movimento, coisas novas, e ambientes que me tragam a oportunidade de aprender e me relacionar com outras pessoas.",
    },
  ],
  copyrightDate: new Date().getFullYear(),
  socialProfiles: [
    {
      id: uuidv4(),
      name: "GitHub",
      icon: "github",
      url: "https://github.com/royan-jason",
    },
    {
      id: uuidv4(),
      name: "Linkedin",
      icon: "linkedin",
      url: "https://www.linkedin.com/in/jason-royan-111180237/",
    },
    {
      id: uuidv4(),
      name: "Instagram",
      icon: "instagram",
      url: "https://www.instagram.com/royanjason/",
    },
  ],
  categories: [
    {
      id: uuidv4(),
      value: "web",
      name: "Web Application",
    },
    {
      id: uuidv4(),
      value: "mobile",
      name: "Mobile Applicaiton",
    },
    {
      id: uuidv4(),
      value: "ui-ux",
      name: "UI/UX Design",
    },
  ],
});

export const getters = {
  getProjectById: (state) => (id) => {
    return state.projects.find((project) => project.id == id);
  },
};

export const mutations = {
  // @todo
};

export const actions = {
  // @todo
};
