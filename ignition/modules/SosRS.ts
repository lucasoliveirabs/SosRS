import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SosRSFactoryModule = buildModule("LockModule", (m) => {
  const sosRSFactory = m.contract("SosRSFactory");
  return { sosRSFactory };
});

export default SosRSFactoryModule;
