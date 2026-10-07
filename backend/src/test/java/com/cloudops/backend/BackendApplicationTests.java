package com.cloudops.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"app.auth.password=test-password",
		"security.jwt.secret=test-only-jwt-secret-not-used-anywhere-real-0123456789"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
