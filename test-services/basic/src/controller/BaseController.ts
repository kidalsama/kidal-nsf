import {GetMapping} from "../../../../src/server/bind";

export class BaseController {
  @GetMapping("base-controller")
  public getBaseController() {
    return "base-controller"
  }
}
