import * as Express from "express";
import {
  After,
  Before,
  Body,
  BodyParam,
  Controller,
  GetMapping,
  HttpRequest,
  HttpResponse,
  Next,
  Param,
  PostMapping,
  Query,
  QueryParam,
  RequestMapping,
} from "../../../../src/server";
import {BaseController} from "./BaseController";
import {LudmilaError} from "../../../../src/error";

/**
 *
 */
@Controller
@RequestMapping("test-binding")
class TestBindingController extends BaseController {
  /**
   *
   */
  @RequestMapping("")
  public async index() {
    return "Welcome to binding test controller"
  }

  /**
   *
   */
  @RequestMapping("undefined")
  public async getUndefined() {
    return undefined
  }

  /**
   *
   */
  @RequestMapping("null")
  public async getNull() {
    return null
  }

  /**
   *
   */
  @RequestMapping("boolean")
  public async getBoolean() {
    return true
  }

  /**
   *
   */
  @RequestMapping("number")
  public async getNumber() {
    return 998.889
  }

  /**
   *
   */
  @GetMapping("string")
  public async getString() {
    return "hello world"
  }

  private async beforeHook(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    res.write("BeforeHook")
  }

  private async afterHook(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    res.write("AfterHook")
  }

  /**
   *
   */
  @GetMapping("hook1")
  @Before(TestBindingController.prototype.beforeHook)
  @After(TestBindingController.prototype.afterHook)
  public async hook1(
    @HttpResponse res: Express.Response,
  ) {
    res.write("Function")
  }

  /**
   * 这个会被全局钩子给钩住，方法名必须是hook2
   */
  @GetMapping("hook2")
  public async hook2(
    @HttpResponse res: Express.Response,
  ) {
    res.write("Function")
  }

  /**
   * Echo
   */
  @PostMapping("echo/:p1/:p2")
  public async echo(
    @HttpRequest req: Express.Request,
    @HttpResponse res: Express.Response,
    @Next next: Function,
    @Query q: any,
    @Body b: any,
    @Param("p1") p1: string,
    @Param("p2") p2: string,
    @QueryParam("q1") q1?: string,
    @QueryParam("q2") q2?: string,
    @BodyParam("b1") b1?: string,
    @BodyParam("b2") b2?: string,
  ) {
    return {q, b, p1, p2, q1, q2, b1, b2}
  }

  /**
   *
   */
  @GetMapping("error")
  public async error() {
    throw new Error("Testing error")
  }

  /**
   *
   */
  @GetMapping("ludmila-error")
  public async ludmilaError() {
    throw new LudmilaError(1, "testing")
  }
}
