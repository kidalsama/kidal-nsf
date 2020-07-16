import * as Express from "express";
import {AfterAll, BeforeAll, GetMapping, OnError} from "../../../../src/server/bind/ControllerBinding";
import {LudmilaError} from "../../../../src/error/LudmilaError";

export class BaseController {
  /**
   *
   */
  @GetMapping("base-controller")
  public getBaseController() {
    return "base-controller"
  }

  /**
   *
   */
  @BeforeAll
  public beforeAll(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    if (req.path.indexOf("hook2") !== -1) {
      res.write("BeforeAllHook")
    }
  }

  /**
   *
   */
  @AfterAll
  public afterAll(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    if (req.path.indexOf("hook2") !== -1) {
      res.write("AfterAllHook")
    }
  }

  /**
   *
   */
  @OnError
  public onError(err: Error, req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    if (err instanceof LudmilaError) {
      res.json(err.data)
    } else {
      next(err)
    }
  }
}
