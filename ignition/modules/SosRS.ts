import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SosRSFactoryModule = buildModule("SosRSFactory", (m) => {
  const sosRSFactory = m.contract("SosRSFactory");
  return { sosRSFactory };
});

export default SosRSFactoryModule;
