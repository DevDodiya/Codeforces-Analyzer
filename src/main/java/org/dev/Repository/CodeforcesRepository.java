package org.dev.Repository;

import com.mongodb.MongoTimeoutException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.ReplaceOptions;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.bson.BsonDocument;
import org.bson.BsonInt64;
import org.bson.Document;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;
import org.dev.Entity.BlogEntry;
import org.dev.Entity.UserInfo;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;

import static com.mongodb.MongoClientSettings.getDefaultCodecRegistry;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

@ApplicationScoped
public class CodeforcesRepository {
    private MongoCollection<UserInfo> userInfoCollection;
    private MongoCollection<BlogEntry> blogEntryCollection;
    private MongoCollection<Document> tagStatsCollection;
    private MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.connection-string")
    String uri;

    public void init(@Observes StartupEvent ev) {
        CodecProvider pojoCodecProvider = PojoCodecProvider.builder().automatic(true).build();
        CodecRegistry pojoCodecRegistry = fromRegistries(getDefaultCodecRegistry(), fromProviders(pojoCodecProvider));

        this.mongoClient = MongoClients.create(uri);
        MongoDatabase database = mongoClient.getDatabase("codeforces").withCodecRegistry(pojoCodecRegistry);

        this.userInfoCollection = database.getCollection("user_info", UserInfo.class);
        this.blogEntryCollection = database.getCollection("blog_entries", BlogEntry.class);
        this.tagStatsCollection = database.getCollection("tag_stats", Document.class);

        if (!isConnected(database)) {
            System.out.println("Failed to connect to database");
        } else {
            System.out.println("Connected to database");
            ensureHandleIndex();
        }
    }

    /** Index on handle so upserts and lookups by handle stay fast. */
    private void ensureHandleIndex() {
        try {
            userInfoCollection.createIndex(Indexes.ascending("handle"));
        } catch (Exception e) {
            System.out.println("Could not create handle index: " + e.getMessage());
        }
    }

    private boolean isConnected(MongoDatabase database) {
        Bson command = new BsonDocument("ping", new BsonInt64(1));
        try {
            database.runCommand(command);
        } catch (MongoTimeoutException e) {
            return false;
        }
        return true;
    }

    public void close(@Observes ShutdownEvent ev) {
        System.out.println("Disconnecting from MongoDB...");
        mongoClient.close();
    }

    public void upsertUserInfo(UserInfo userInfo) {
        userInfoCollection.replaceOne(Filters.eq("handle", userInfo.getHandle()), userInfo, new ReplaceOptions().upsert(true));
        System.out.println("Upserted UserInfo in MongoDB: " + userInfo.getHandle());
    }

    public void upsertBlogEntry(BlogEntry blogEntry) {
        blogEntryCollection.replaceOne(Filters.eq("blogId", String.valueOf(blogEntry.getId())), blogEntry, new ReplaceOptions().upsert(true));
        System.out.println("Upserted BlogEntry in MongoDB: " + blogEntry.getAuthorHandle());
    }

    public Document getTagStats(String handle) {
        return tagStatsCollection.find(Filters.eq("handle", handle)).first();
    }

    public void saveTagStats(String handle, Map<String, Integer> tagMap) {
        Document doc = new Document("handle", handle).append("tags", tagMap);
        tagStatsCollection.deleteMany(Filters.eq("handle", handle));
        tagStatsCollection.insertOne(doc);
        System.out.println("Stored tag stats for: " + handle);
    }
}
