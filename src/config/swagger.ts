import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ODX API",
      version: "1.0.0",
      description: "Documentação da API do sistema ODX (Odontologia Legal)",
    },
    servers: [
      {
        url: "https://odx-pericias-back.onrender.com"
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
