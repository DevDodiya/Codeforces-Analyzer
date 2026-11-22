package org.dev.Repository;

import com.mongodb.MongoTimeoutException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.BulkWriteOptions;
import com.mongodb.client.model.Collation;
import com.mongodb.client.model.CollationStrength;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.ReplaceOneModel;
import com.mongodb.client.model.ReplaceOptions;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.WriteModel;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.mongodb.MongoClientSettings.getDefaultCodecRegistry;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

@ApplicationScoped
public class CodeforcesRepository {
    private MongoCollection<UserInfo> userInfoCollection;
    private MongoCollection<Document> userInfoRawCollection; // same collection, raw Document view (seeding)
    private MongoCollection<BlogEntry> blogEntryCollection;
    private MongoCollection<Document> tagStatsCollection;
    private MongoClient mongoClient;

    // Case-insensitive collation so an indexed prefix range matches any casing.
    private static final Collation CI_COLLATION = Collation.builder()
            .locale("en")
            .collationStrength(CollationStrength.SECONDARY)
            .build();

    @ConfigProperty(name = "quarkus.mongodb.connection-string")
    String uri;

    public void init(@Observes StartupEvent ev) {
        CodecProvider pojoCodecProvider = PojoCodecProvider.builder().automatic(true).build();
        CodecRegistry pojoCodecRegistry = fromRegistries(getDefaultCodecRegistry(), fromProviders(pojoCodecProvider));

        this.mongoClient = MongoClients.create(uri);
        MongoDatabase database = mongoClient.getDatabase("codeforces").withCodecRegistry(pojoCodecRegistry);

        this.userInfoCollection = database.getCollection("user_info", UserInfo.class);
        this.userInfoRawCollection = database.getCollection("user_info");
        this.blogEntryCollection = database.getCollection("blog_entries", BlogEntry.class);
        this.tagStatsCollection = database.getCollection("tag_stats", Document.class);

        if (!isConnected(database)) {
            System.out.println("Failed to connect to database");
        } else {
            System.out.println("Connected to database");
            ensureHandleIndex();
        }
    }

    /** Case-insensitive index on handle so the suggestion prefix query stays an index scan. */
    private void ensureHandleIndex() {
        try {
            userInfoCollection.createIndex(
                    Indexes.ascending("handle"),
                    new IndexOptions().collation(CI_COLLATION));
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

    /**
     * Suggest previously-seen handles starting with the given prefix (case-insensitive),
     * strongest users first. Backed by the pool of profiles already looked up.
     *
     * Optimised: an indexed prefix *range* scan (handle >= prefix AND handle < prefix+￿)
     * under a case-insensitive collation — no full-collection regex scan — with a field
     * projection so only the data the suggestion UI needs is read.
     */
    public List<UserInfo> suggestHandles(String prefix, int limit) {
        List<UserInfo> out = new ArrayList<>();
        Bson filter = Filters.and(
                Filters.gte("handle", prefix),
                Filters.lt("handle", prefix + "￿"));
        userInfoCollection.find(filter)
                .collation(CI_COLLATION)
                .projection(Projections.include("handle", "rating", "rank", "titlePhoto", "avatar"))
                .sort(Sorts.descending("rating"))
                .limit(limit)
                .into(out);
        return out;
    }

    /** Fast approximate count of stored handles — used to decide whether to seed the directory. */
    public long countHandles() {
        return userInfoRawCollection.estimatedDocumentCount();
    }

    /**
     * Bulk-upsert a batch of lightweight handle documents (handle, rating, rank,
     * titlePhoto, avatar, …) into the user_info collection. Upsert keyed on handle
     * so it never duplicates an existing profile and is safe to re-run. Unordered
     * so one bad row can't abort the batch. Returns the number of operations applied.
     */
    public int seedHandles(List<Document> handleDocs) {
        if (handleDocs == null || handleDocs.isEmpty()) {
            return 0;
        }
        List<WriteModel<Document>> ops = new ArrayList<>(handleDocs.size());
        for (Document d : handleDocs) {
            Object handle = d.get("handle");
            if (handle == null) {
                continue;
            }
            ops.add(new ReplaceOneModel<>(
                    Filters.eq("handle", handle),
                    d,
                    new ReplaceOptions().upsert(true)));
        }
        if (ops.isEmpty()) {
            return 0;
        }
        userInfoRawCollection.bulkWrite(ops, new BulkWriteOptions().ordered(false));
        return ops.size();
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
