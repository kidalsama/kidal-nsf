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

  /**
   *
   */
  @GetMapping("hook1")
  @Before((req, res, next) => {
    res.write("BeforeHook")
  })
  @After((req, res, next) => {
    res.write("AfterHook")
  })
  public async hook1(
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
}
