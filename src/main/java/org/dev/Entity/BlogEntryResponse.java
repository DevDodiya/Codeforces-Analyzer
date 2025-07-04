package org.dev.Entity;

import java.util.List;

public class BlogEntryResponse {
    private String status;
    private List<BlogEntry> result;

    public List<BlogEntry> getResult() {
        return result;
    }
}