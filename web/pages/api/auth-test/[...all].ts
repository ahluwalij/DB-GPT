import { minimalAuth } from "../../../lib/auth/minimal-test";
import { createPagesHandler } from "../../../lib/auth/pages-adapter";

export default createPagesHandler(minimalAuth);