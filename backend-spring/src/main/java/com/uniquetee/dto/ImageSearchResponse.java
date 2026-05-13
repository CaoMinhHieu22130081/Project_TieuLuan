package com.uniquetee.dto;

import java.util.ArrayList;
import java.util.List;

public class ImageSearchResponse {

    private String model;
    private Integer catalogSize;
    private String predictedType;
    private Integer typeConfidence;
    private Boolean filteredByType;
    private List<ImageSearchResult> results = new ArrayList<>();

    public ImageSearchResponse() {
    }

    public ImageSearchResponse(String model, Integer catalogSize, List<ImageSearchResult> results) {
        this.model = model;
        this.catalogSize = catalogSize;
        this.results = results;
    }

    public ImageSearchResponse(String model, Integer catalogSize, String predictedType, Integer typeConfidence,
            Boolean filteredByType, List<ImageSearchResult> results) {
        this.model = model;
        this.catalogSize = catalogSize;
        this.predictedType = predictedType;
        this.typeConfidence = typeConfidence;
        this.filteredByType = filteredByType;
        this.results = results;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getCatalogSize() {
        return catalogSize;
    }

    public void setCatalogSize(Integer catalogSize) {
        this.catalogSize = catalogSize;
    }

    public String getPredictedType() {
        return predictedType;
    }

    public void setPredictedType(String predictedType) {
        this.predictedType = predictedType;
    }

    public Integer getTypeConfidence() {
        return typeConfidence;
    }

    public void setTypeConfidence(Integer typeConfidence) {
        this.typeConfidence = typeConfidence;
    }

    public Boolean getFilteredByType() {
        return filteredByType;
    }

    public void setFilteredByType(Boolean filteredByType) {
        this.filteredByType = filteredByType;
    }

    public List<ImageSearchResult> getResults() {
        return results;
    }

    public void setResults(List<ImageSearchResult> results) {
        this.results = results;
    }
}