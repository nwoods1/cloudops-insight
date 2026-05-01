package com.cloudops.backend.model;

public class ExportResponse {
    private String fileName;
    private String s3Key;
    private String downloadUrl;
    private String message;

    public ExportResponse() {
    }

    public ExportResponse(String fileName, String s3Key, String downloadUrl, String message) {
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.downloadUrl = downloadUrl;
        this.message = message;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
