package com.uniquetee.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.dto.GhnShippingQuoteRequest;
import com.uniquetee.service.GhnShippingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/shipping/ghn")
@CrossOrigin(origins = {
        "http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:5174", "http://localhost:5174",
        "http://127.0.0.1:5175", "http://localhost:5175",
        "http://127.0.0.1:5176", "http://localhost:5176"
}, allowCredentials = "true")
public class ShippingController {

    @Autowired
    private GhnShippingService ghnShippingService;

    @GetMapping("/configured")
    public ResponseEntity<Map<String, Object>> getConfigurationState() {
        return ResponseEntity.ok(ghnShippingService.getConfigurationState());
    }

    @GetMapping("/provinces")
    public ResponseEntity<List<Map<String, Object>>> getProvinces() {
        return ResponseEntity.ok(ghnShippingService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<List<Map<String, Object>>> getDistricts(@RequestParam Integer provinceId) {
        return ResponseEntity.ok(ghnShippingService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<List<Map<String, Object>>> getWards(@RequestParam Integer districtId) {
        return ResponseEntity.ok(ghnShippingService.getWards(districtId));
    }

    @PostMapping("/quote")
    public ResponseEntity<Map<String, Object>> quoteShippingFee(@Valid @RequestBody GhnShippingQuoteRequest request) {
        return ResponseEntity.ok(ghnShippingService.quoteShippingFee(request));
    }
}