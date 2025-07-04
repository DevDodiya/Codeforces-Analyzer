package org.dev.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.bson.codecs.pojo.annotations.BsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BlogEntry {

    @BsonProperty("uniqueID")
    private Long id;
    private String authorHandle;

    public Long getId() {
        return id;
    }

    public String getAuthorHandle() {
        return authorHandle;
    }
}