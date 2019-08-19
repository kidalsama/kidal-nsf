import {Autowired} from "../../../src/ioc";
import IBaseType from "./parent-type";

export class Worker {
    @Autowired public type: IBaseType;

    public work() {
        this.type.method1();
    }
}
