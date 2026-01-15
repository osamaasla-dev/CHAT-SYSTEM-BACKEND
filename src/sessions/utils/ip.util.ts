import { isIP } from 'node:net';

const getIPv4SubnetValue = (
  ip: string,
  prefixLength: number,
): number | null => {
  const octets = ip.split('.').map((part) => Number(part));
  if (
    octets.length !== 4 ||
    octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)
  ) {
    return null;
  }

  const value =
    ((octets[0] << 24) >>> 0) |
    ((octets[1] << 16) >>> 0) |
    ((octets[2] << 8) >>> 0) |
    (octets[3] >>> 0);

  if (prefixLength <= 0) {
    return 0;
  }

  if (prefixLength >= 32) {
    return value;
  }

  const mask = (0xffffffff << (32 - prefixLength)) >>> 0;
  return value & mask;
};

export const areIpsInSameSubnet = (
  expectedIp: string,
  incomingIp: string,
  prefixLength = 24,
): boolean => {
  const expectedVersion = isIP(expectedIp);
  const incomingVersion = isIP(incomingIp);

  if (expectedVersion === 4 && incomingVersion === 4) {
    const expectedSubnet = getIPv4SubnetValue(expectedIp, prefixLength);
    const incomingSubnet = getIPv4SubnetValue(incomingIp, prefixLength);

    if (expectedSubnet === null || incomingSubnet === null) {
      return expectedIp === incomingIp;
    }

    return expectedSubnet === incomingSubnet;
  }

  if (expectedVersion === 6 && incomingVersion === 6) {
    // TODO: apply configurable IPv6 subnet matching if needed
    return expectedIp === incomingIp;
  }

  return expectedIp === incomingIp;
};
