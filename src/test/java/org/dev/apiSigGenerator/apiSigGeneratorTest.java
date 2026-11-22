package org.dev.apiSigGenerator;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Plain unit tests for the Codeforces API-signature logic — no Quarkus context,
 * database, or network required, so they run fast and deterministically in CI.
 */
class apiSigGeneratorTest {

    @Test
    void sha512_matchesKnownVectors() {
        assertEquals(
                "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce" +
                        "47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
                apiSigGenerator.sha512(""));
        assertEquals(
                "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a" +
                        "2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
                apiSigGenerator.sha512("abc"));
    }

    @Test
    void createApiSig_hasRandomPrefixAndSha512Suffix() {
        apiSigGenerator gen = new apiSigGenerator();
        gen.apiKey = "testKey";
        gen.apiSecret = "testSecret";
        gen.randomString = "123456";

        Map<String, String> params = new HashMap<>();
        params.put("handles", "tourist");
        String sig = gen.createApiSig("user.info", params);

        assertNotNull(sig);
        assertTrue(sig.startsWith("123456"), "signature must start with the random string");
        assertEquals(6 + 128, sig.length(), "random (6) + SHA-512 hex (128)");
        assertTrue(sig.substring(6).matches("[0-9a-f]{128}"), "suffix must be 128 hex chars");
    }

    @Test
    void createApiSig_differsByMethod() {
        apiSigGenerator gen = new apiSigGenerator();
        gen.apiKey = "k";
        gen.apiSecret = "s";
        gen.randomString = "abcdef";

        Map<String, String> params = new HashMap<>();
        params.put("handle", "x");

        assertNotEquals(
                gen.createApiSig("user.info", params),
                gen.createApiSig("user.rating", params));
    }
}
