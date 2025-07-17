import { authV2 } from "../../../lib/auth/server-v2";
import { createPagesHandler } from "../../../lib/auth/pages-adapter";

export default createPagesHandler(authV2);