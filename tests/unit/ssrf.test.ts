import { describe, it, expect } from 'vitest';
import { isPrivateHostnameOrIp, isSafePublicUrl, isRecognizedAmazonHost } from '@/lib/security/ssrf';

describe('SSRF & Open Redirect Protection', () => {
  it('blocks private loopback and LAN IP addresses', () => {
    expect(isPrivateHostnameOrIp('localhost')).toBe(true);
    expect(isPrivateHostnameOrIp('127.0.0.1')).toBe(true);
    expect(isPrivateHostnameOrIp('10.0.0.1')).toBe(true);
    expect(isPrivateHostnameOrIp('192.168.1.1')).toBe(true);
    expect(isPrivateHostnameOrIp('172.16.0.1')).toBe(true);
    expect(isPrivateHostnameOrIp('169.254.169.254')).toBe(true); // AWS IMDS
    expect(isPrivateHostnameOrIp('::1')).toBe(true);
    expect(isPrivateHostnameOrIp('subdomain.local')).toBe(true);
  });

  it('allows safe public hostnames', () => {
    expect(isPrivateHostnameOrIp('amazon.com')).toBe(false);
    expect(isPrivateHostnameOrIp('amazon.co.uk')).toBe(false);
    expect(isPrivateHostnameOrIp('google.com')).toBe(false);
  });

  it('blocks dangerous schemes and internal ports in URLs', () => {
    expect(isSafePublicUrl('file:///etc/passwd').isSafe).toBe(false);
    expect(isSafePublicUrl('ftp://example.com').isSafe).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1:8080').isSafe).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data').isSafe).toBe(false);
    expect(isSafePublicUrl('https://amazon.com/dp/B08N5WRWNW').isSafe).toBe(true);
  });

  it('verifies recognized Amazon hosts and shorteners', () => {
    expect(isRecognizedAmazonHost('amazon.com')).toBe(true);
    expect(isRecognizedAmazonHost('www.amazon.co.uk')).toBe(true);
    expect(isRecognizedAmazonHost('amzn.to')).toBe(true);
    expect(isRecognizedAmazonHost('a.co')).toBe(true);
    expect(isRecognizedAmazonHost('evil-phishing-amazon.com')).toBe(false);
    expect(isRecognizedAmazonHost('google.com')).toBe(false);
  });
});
