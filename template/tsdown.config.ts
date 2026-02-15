import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

const Config: UserConfig = defineConfig({
  exports: true,
  failOnWarn: true,
});

export default Config;
