import {Controller, QueryParam, RequestMapping} from "../../../../src/server";

/**
 *
 */
@Controller
@RequestMapping("hello")
class HelloController {
  /**
   * hello world
   */
  @RequestMapping("world")
  public async world() {
    return "hello world"
  }

  /**
   * Echo
   */
  @RequestMapping("echo")
  public async echo(
    @QueryParam("str") str?: string,
  ) {
    return str
  }
}
