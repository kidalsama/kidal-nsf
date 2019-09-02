import {ApolloServer, ApolloServerExpressConfig, ServerRegistration} from "apollo-server-express";
import Cors from "cors"
import Accepts from "accepts"
// @ts-ignore
import TypeIs from "type-is"
import expressApollo = require("apollo-server-express/dist/expressApollo");
import BodyParser = require("body-parser");
import ApolloServerCore = require("apollo-server-core");
import GraphqlPlaygroundHtml = require( "@apollographql/graphql-playground-html");

const fileUploadMiddleware = (uploadsConfig: any, server: any) => (req: any, res: any, next: any) => {
  if (typeof ApolloServerCore.processFileUploads === "function" &&
    TypeIs(req, ["multipart/form-data"])) {
    // @ts-ignore
    ApolloServerCore.processFileUploads(req, res, uploadsConfig)
      .then((body) => {
        req.body = body;
        next();
      })
      .catch((error) => {
        if (error.status && error.expose) {
          res.status(error.status);
        }
        next(ApolloServerCore.formatApolloErrors([error], {
          formatter: server.requestOptions.formatError,
          debug: server.requestOptions.debug,
        }));
      });
  } else {
    next();
  }
};

/**
 * @author tengda
 */
export default class GraphQLApolloServer extends ApolloServer {
  constructor(config: ApolloServerExpressConfig) {
    super(config);
  }

  public applyMiddleware(
    {
      app,
      path,
      cors,
      bodyParserConfig,
      disableHealthCheck,
      onHealthCheck,
    }: ServerRegistration,
  ): void {
    if (!path) {
      path = "/graphql"
    }
    const promiseWillStart = this.willStart()
    app.use(path, (_req, _res, next) => {
      promiseWillStart.then(() => next()).catch(next);
    });
    if (!disableHealthCheck) {
      app.use("/.well-known/apollo/server-health", (req, res) => {
        res.type("application/health+json");
        if (onHealthCheck) {
          onHealthCheck(req)
            .then(() => {
              res.json({status: "pass"});
            })
            .catch(() => {
              res.status(503).json({status: "fail"});
            });
        } else {
          res.json({status: "pass"});
        }
      });
    }
    let uploadsMiddleware;
    if (this.uploadsConfig && typeof ApolloServerCore.processFileUploads === "function") {
      uploadsMiddleware = fileUploadMiddleware(this.uploadsConfig, this);
    }
    this.graphqlPath = path;
    if (cors === true) {
      app.use(path, Cors());
    } else if (cors !== false) {
      app.use(path, Cors(cors));
    }
    if (bodyParserConfig === true) {
      app.use(path, BodyParser.json());
    } else if (bodyParserConfig !== false) {
      app.use(path, BodyParser.json(bodyParserConfig));
    }
    if (uploadsMiddleware) {
      app.use(path, uploadsMiddleware);
    }
    app.use(path, (req, res, next) => {
      if (this.playgroundOptions && req.method === "GET") {
        const accept = Accepts(req);
        const types = accept.types();
        const prefersHTML = (types as string[]).find(
          (x: string) => x === "text/html" || x === "application/json") === "text/html";
        if (prefersHTML) {
          const playgroundRenderPageOptions = Object.assign({
            endpoint: path,
            subscriptionEndpoint: this.subscriptionsPath,
          }, this.playgroundOptions);
          res.setHeader("Content-Type", "text/html");
          const playground = GraphqlPlaygroundHtml.renderPlaygroundPage(playgroundRenderPageOptions);
          res.write(playground);
          res.end();
          return;
        }
      }

      return expressApollo.graphqlExpress(() => {
        return this.createGraphQLServerOptions(req, res)
      })(req, res, next)
    });
  }
}
