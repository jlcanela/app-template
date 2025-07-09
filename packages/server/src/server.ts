import { HttpLayerRouter, HttpServer, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { DomainApi } from "@org/domain/domain-api";
import { Layer } from "effect";
import { createServer } from "http";
import { StylesRpcLive } from "./domain/styles/styles-rpc-live.js";

const ApiLive = HttpLayerRouter.addHttpApi(DomainApi, {
  openapiPath: "/v1/swagger.json",
})
  .pipe

  //   Layer.provide(HealthGroupLive)
  ();

const HealthRouter = HttpLayerRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const swaggerHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/v1/swagger.json',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>
`;

const SwaggerRouter = HttpLayerRouter.use((router) =>
  router.add("GET", "/docs", HttpServerResponse.html(swaggerHtml)),
);

const AllRoutes = Layer.mergeAll(ApiLive, HealthRouter, SwaggerRouter).pipe(
  Layer.provide(StylesRpcLive),
);

const HttpLive = HttpLayerRouter.serve(AllRoutes).pipe(
  HttpServer.withLogAddress,
  Layer.provide(
    NodeHttpServer.layer(createServer, {
      port: 3000,
    }),
  ),
);

NodeRuntime.runMain(Layer.launch(HttpLive));
