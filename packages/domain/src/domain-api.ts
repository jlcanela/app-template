import { HttpApi } from "@effect/platform";
import { ProjectsGroup } from "./api/projects-rpc.js";
import { SearchGroup } from "./api/search-rpc.js";
import { StylesGroup } from "./api/styles-rpc.js";

export class DomainApi extends HttpApi.make("DomainApi")
  .add(StylesGroup)
  .add(ProjectsGroup)
  .add(SearchGroup) {}
