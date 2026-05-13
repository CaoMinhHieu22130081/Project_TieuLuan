package com.uniquetee.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.uniquetee.dto.ImageSearchResponse;
import com.uniquetee.service.AiImageSearchService;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = {
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5176",
        "http://localhost:5176" }, allowCredentials = "true")
public class AiSearchController {

    @Autowired
    private AiImageSearchService aiImageSearchService;

    @PostMapping(value = "/image-search", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> searchByImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(value = "type", required = false) String type) {
        try {
            ImageSearchResponse response = aiImageSearchService.searchByImage(file, limit, type);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}