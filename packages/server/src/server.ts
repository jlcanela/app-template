import { NodeSdk } from "@effect/opentelemetry";
import { HttpLayerRouter, HttpServer, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { OTLPTraceExporter as OTLPTraceExporterGrpc } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as OTLPTraceExporterHttp } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { DomainApi } from "@org/domain/domain-api";
import { Layer } from "effect";
import { createServer } from "http";
import { ProjectsRpcLive } from "./domain/projects/projects-rpc-live.js";
import { SearchRpcLive } from "./domain/search/search-rpc-live.js";
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
  router.add("GET", "/swagger", HttpServerResponse.html(swaggerHtml)),
);

const AllRoutes = Layer.mergeAll(ApiLive, HealthRouter, SwaggerRouter).pipe(
  Layer.provide(StylesRpcLive),
  Layer.provide(ProjectsRpcLive),
  Layer.provide(SearchRpcLive),
);

const portEnv = process.env.PORT;
const port = Number.isInteger(Number(portEnv)) && Number(portEnv) > 0 ? Number(portEnv) : 3000;

const oltp_grpc = process.env.OTEL_EXPORTER_OTLP_PROTOCOL === "grpc";

// export interface Configuration {
//   readonly spanProcessor?: SpanProcessor | ReadonlyArray<SpanProcessor> | undefined
//   readonly tracerConfig?: Omit<TracerConfig, "resource"> | undefined
//   readonly metricReader?: MetricReader | ReadonlyArray<MetricReader> | undefined
//   readonly logRecordProcessor?: LogRecordProcessor | ReadonlyArray<LogRecordProcessor> | undefined
//   readonly loggerProviderConfig?: Omit<LoggerProviderConfig, "resource"> | undefined
//   readonly resource?: {
//     readonly serviceName: string
//     readonly serviceVersion?: string
//     readonly attributes?: OtelApi.Attributes
//   } | undefined
//   readonly shutdownTimeout?: DurationInput | undefined
// }

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: process.env.OTEL_SERVICE_NAME || "Api" },
  spanProcessor: new BatchSpanProcessor(
    oltp_grpc ? new OTLPTraceExporterGrpc() : new OTLPTraceExporterHttp(),
  ),
  // logRecordProcessor: new BatchLogRecordProcessor(oltp_grpc ? new OTLPLogExporterGrpc() : new OTLPLogExporterHttp()),
}));

const HttpLive = HttpLayerRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeSdkLive),
  HttpServer.withLogAddress,
  Layer.provide(
    NodeHttpServer.layer(createServer, {
      port,
    }),
  ),
);

NodeRuntime.runMain(Layer.launch(HttpLive));
// NodeRuntime.runMain(httpServer, { disablePrettyLogger: true })
