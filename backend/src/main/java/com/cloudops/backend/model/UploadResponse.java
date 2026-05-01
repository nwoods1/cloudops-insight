package com.cloudops.backend.model;

public class UploadResponse {
    private String fileName;
    private String s3Key;
    private String message;

    public UploadResponse(String fileName, String s3Key, String message) {
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.message = message;
    }

    public String getFileName() {
        return fileName;
    }

    public String getS3Key() {
        return s3Key;
    }

    public String getMessage() {
        return message;
    }
}