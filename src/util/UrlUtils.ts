import * as url from "url"
import Maybe from "./Maybe";

export default {
  url,
  removeProtocol(s: Maybe<string>): Maybe<string> {
    if (!s) {
      return s
    } else if (s.startsWith("//")) {
      return s
    } else if (s.startsWith("http://")) {
      return s.substring("http:".length)
    } else if (s.startsWith("https://")) {
      return s.substring("https:".length)
    } else {
      return s
    }
  },
}
