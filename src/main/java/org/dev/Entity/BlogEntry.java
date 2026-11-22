package org.dev.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.bson.codecs.pojo.annotations.BsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BlogEntry {

    @BsonProperty("uniqueID")
    private Long id;
    private String authorHandle;
    private String title;
    private Long creationTimeSeconds;
    private Integer rating;

    public Long getId() {
        return id;
    }

    public String getAuthorHandle() {
        return authorHandle;
    }

    public String getTitle() {
        return title;
    }

    public Long getCreationTimeSeconds() {
        return creationTimeSeconds;
    }

    public Integer getRating() {
        return rating;
    }
}
