import { HttpApi } from "@effect/platform";
import { AdminGroup } from "./api/admin-rpc.js";
import { ProjectsGroup } from "./api/projects-rpc.js";
import { SearchGroup } from "./api/search-rpc.js";
import { SseGroup } from "./api/sse-rpc.js";
import { StylesGroup } from "./api/styles-rpc.js";

export class DomainApi extends HttpApi.make("DomainApi")
  .add(AdminGroup)
  .add(StylesGroup)
  .add(ProjectsGroup)
  .add(SearchGroup)
  .add(SseGroup) {}
