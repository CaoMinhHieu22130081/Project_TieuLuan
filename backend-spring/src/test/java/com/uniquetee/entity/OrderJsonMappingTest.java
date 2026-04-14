package com.uniquetee.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class OrderJsonMappingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesNestedUserIdFromCheckoutPayload() throws Exception {
        String json = """
            {
              "orderCode": "UNQ-TEST-001",
              "paymentMethod": "cod",
              "status": "pending",
              "user": { "id": 15 }
            }
            """;

        Order order = objectMapper.readValue(json, Order.class);

        assertNotNull(order.getUser());
        assertEquals(15, order.getUser().getId());
        assertEquals("cod", order.getPaymentMethod());
    }
}