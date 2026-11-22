package org.dev.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.dev.Entity.BlogEntryResponse;
import org.dev.Entity.UserInfo;
import org.dev.Entity.UserInfoResponse;
import org.dev.Repository.CodeforcesRepository;
import org.dev.apiSigGenerator.apiSigGenerator;
import org.dev.proxies.getUserBlogs;
import org.dev.proxies.getUserInfo;
import org.dev.proxies.getUserRating;
import org.dev.proxies.getUserSubmissions;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

@ApplicationScoped
@Path("/")
public class codeforcesResources {

    @ConfigProperty(name = "codeforces.apiKey")
    String apiKey;

    @Inject
    apiSigGenerator apiSigGenerator;

    @Inject
    CodeforcesRepository codeforcesRepository;

    @Inject
    @RestClient
    getUserInfo getUserInfoProxy;

    @Inject
    @RestClient
    getUserBlogs getUserBlogsProxy;

    @Inject
    @RestClient
    getUserSubmissions userSubmissionsProxy;

    @Inject
    @RestClient
    getUserRating userRatingProxy;

    @Inject
    RedisDataSource redisDS;

    @ConfigProperty(name = "redis.cache.ttl", defaultValue = "3600")
    long cacheTtl;

    @GET
    @Path("user-info/{handles}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response fetchUserInfo(@PathParam("handles") String handles) {
        String redisKey = "user-info:" + handles;
        String cached = redisDS.value(String.class).get(redisKey);

        if (cached != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                UserInfoResponse userInfoResp = mapper.readValue(cached, UserInfoResponse.class);
                return Response.ok(userInfoResp).build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize cached user info: " + e.getMessage());
            }
        }

        long time = System.currentTimeMillis() / 1000;
        Map<String, String> params = new HashMap<>();
        params.put("handles", handles);
        String apiSig = apiSigGenerator.createApiSig("user.info", params);

        try {
            UserInfoResponse userInfoResp = getUserInfoProxy.getUserInfoAPI(handles, apiKey, time, apiSig);

            userInfoResp.getResult().forEach(user -> {
                codeforcesRepository.upsertUserInfo(user);
            });

            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(userInfoResp);
            redisDS.value(String.class).setex(redisKey, cacheTtl, json);

            return Response.ok(userInfoResp).build();
        } catch (Exception e) {
            return mapUpstreamError(handles, e);
        }
    }

    @GET
    @Path("user-blogs/{handle}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response fetchUserBlogs(@PathParam("handle") String handle) {
        String redisKey = "user-blogs:" + handle;
        String cached = redisDS.value(String.class).get(redisKey);

        if (cached != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                BlogEntryResponse blogEntryResp = mapper.readValue(cached, BlogEntryResponse.class);
                return Response.ok(blogEntryResp).build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize cached blog entries: " + e.getMessage());
            }
        }

        long time = System.currentTimeMillis() / 1000;
        Map<String, String> params = new HashMap<>();
        params.put("handle", handle);
        String apiSig = apiSigGenerator.createApiSig("user.blogEntries", params);

        try {
            BlogEntryResponse blogEntryResp = getUserBlogsProxy.getUserBlogsAPI(handle, apiKey, time, apiSig);

            blogEntryResp.getResult().forEach(blog -> {
                codeforcesRepository.upsertBlogEntry(blog);
            });

            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(blogEntryResp);
            redisDS.value(String.class).setex(redisKey, cacheTtl, json);

            return Response.ok(blogEntryResp).build();
        } catch (Exception e) {
            return mapUpstreamError(handle, e);
        }
    }

    @GET
    @Path("solved-tags/{handle}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getSolvedTags(@PathParam("handle") String handle) {
        String redisKey = "solved-tags:" + handle;
        String cached = redisDS.value(String.class).get(redisKey);

        if (cached != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Integer> cachedTags = mapper.readValue(cached, Map.class);
                return Response.ok(cachedTags).build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize cached tag stats: " + e.getMessage());
            }
        }

        try {
            String json = userSubmissionsProxy.getUserSubmissions(handle);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode result = root.get("result");

            Map<String, Set<String>> tagToProblems = new HashMap<>();

            for (JsonNode submission : result) {
                if (!"OK".equals(submission.get("verdict").asText())) continue;
                JsonNode problem = submission.get("problem");
                if (!problem.has("contestId") || !problem.has("index") || !problem.has("tags")) continue;
                String uniqueId = problem.get("contestId").asText() + problem.get("index").asText();
                for (JsonNode tagNode : problem.get("tags")) {
                    String tag = tagNode.asText();
                    tagToProblems.computeIfAbsent(tag, k -> new HashSet<>()).add(uniqueId);
                }
            }

            Map<String, Integer> tagCounts = new HashMap<>();
            for (Map.Entry<String, Set<String>> entry : tagToProblems.entrySet()) {
                tagCounts.put(entry.getKey(), entry.getValue().size());
            }

            codeforcesRepository.saveTagStats(handle, tagCounts);
            String serialized = new ObjectMapper().writeValueAsString(tagCounts);
            redisDS.value(String.class).setex(redisKey, cacheTtl, serialized);

            return Response.ok(tagCounts).build();
        } catch (Exception e) {
            return mapUpstreamError(handle, e);
        }
    }

    @GET
    @Path("solved-count/{handle}/{difficulty}")
    public Response getSolvedCount(@PathParam("handle") String handle, @PathParam("difficulty") int difficulty) {
        try {
            String json = userSubmissionsProxy.getUserSubmissions(handle);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode result = root.get("result");

            int count = 0;
            Set<String> solvedProblems = new HashSet<>();

            for (JsonNode submission : result) {
                if (!"OK".equals(submission.get("verdict").asText())) continue;
                JsonNode problem = submission.get("problem");
                if (problem.has("rating") && problem.get("rating").asInt() == difficulty) {
                    String uniqueId = problem.get("contestId").asText() + problem.get("index").asText();
                    solvedProblems.add(uniqueId);
                }
            }

            return Response.ok("User " + handle + " has solved " + solvedProblems.size() + " problems of difficulty " + difficulty + ".").build();
        } catch (Exception e) {
            return mapUpstreamError(handle, e);
        }
    }

    @GET
    @Path("handles/suggest")
    public Response suggestHandles(@QueryParam("q") String q,
                                   @QueryParam("limit") @DefaultValue("8") int limit) {
        String prefix = q == null ? "" : q.trim();
        if (prefix.isEmpty()) {
            return Response.ok(new ArrayList<>()).build();
        }
        int capped = Math.min(Math.max(limit, 1), 15);
        String redisKey = "suggest:" + capped + ":" + prefix.toLowerCase();

        String cached = redisDS.value(String.class).get(redisKey);
        if (cached != null) {
            try {
                List<?> list = new ObjectMapper().readValue(cached, List.class);
                return Response.ok(list).build();
            } catch (Exception ignored) {
                // fall through
            }
        }

        try {
            List<UserInfo> matches = codeforcesRepository.suggestHandles(prefix, capped);
            List<Map<String, Object>> out = new ArrayList<>();
            for (UserInfo u : matches) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("handle", u.getHandle());
                m.put("rating", u.getRating());
                m.put("rank", u.getRank());
                m.put("titlePhoto", u.getTitlePhoto());
                m.put("avatar", u.getAvatar());
                out.add(m);
            }
            String serialized = new ObjectMapper().writeValueAsString(out);
            redisDS.value(String.class).setex(redisKey, 60, serialized);
            return Response.ok(out).build();
        } catch (Exception e) {
            // Suggestions are best-effort; never break the search box.
            return Response.ok(new ArrayList<>()).build();
        }
    }

    @GET
    @Path("rating-history/{handle}")
    public Response getRatingHistory(@PathParam("handle") String handle) {
        String redisKey = "rating-history:" + handle;
        String cached = redisDS.value(String.class).get(redisKey);
        if (cached != null) {
            try {
                List<?> list = new ObjectMapper().readValue(cached, List.class);
                return Response.ok(list).build();
            } catch (Exception ignored) {
                // cache unreadable -> refetch below
            }
        }

        try {
            String json = userRatingProxy.getUserRating(handle);
            JsonNode result = new ObjectMapper().readTree(json).get("result");

            List<Map<String, Object>> history = new ArrayList<>();
            if (result != null) {
                for (JsonNode c : result) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("contestId", c.path("contestId").asInt());
                    entry.put("contestName", c.path("contestName").asText());
                    entry.put("rank", c.path("rank").asInt());
                    entry.put("oldRating", c.path("oldRating").asInt());
                    entry.put("newRating", c.path("newRating").asInt());
                    entry.put("ratingUpdateTimeSeconds", c.path("ratingUpdateTimeSeconds").asLong());
                    history.add(entry);
                }
            }

            String serialized = new ObjectMapper().writeValueAsString(history);
            redisDS.value(String.class).setex(redisKey, cacheTtl, serialized);
            return Response.ok(history).build();
        } catch (Exception e) {
            return mapUpstreamError(handle, e);
        }
    }

    @GET
    @Path("difficulty-distribution/{handle}")
    public Response getDifficultyDistribution(@PathParam("handle") String handle) {
        String redisKey = "difficulty-distribution:" + handle;
        String cached = redisDS.value(String.class).get(redisKey);
        if (cached != null) {
            try {
                Map<?, ?> dist = new ObjectMapper().readValue(cached, Map.class);
                return Response.ok(dist).build();
            } catch (Exception ignored) {
                // cache unreadable -> refetch below
            }
        }

        try {
            String json = userSubmissionsProxy.getUserSubmissions(handle);
            JsonNode result = new ObjectMapper().readTree(json).get("result");

            // Group distinct solved problems by their difficulty rating (ascending).
            Map<Integer, Set<String>> ratingToProblems = new TreeMap<>();
            if (result != null) {
                for (JsonNode submission : result) {
                    if (!"OK".equals(submission.path("verdict").asText())) continue;
                    JsonNode problem = submission.get("problem");
                    if (problem == null || !problem.has("rating")
                            || !problem.has("contestId") || !problem.has("index")) continue;
                    int rating = problem.get("rating").asInt();
                    String uniqueId = problem.get("contestId").asText() + problem.get("index").asText();
                    ratingToProblems.computeIfAbsent(rating, k -> new HashSet<>()).add(uniqueId);
                }
            }

            Map<String, Integer> distribution = new LinkedHashMap<>();
            for (Map.Entry<Integer, Set<String>> e : ratingToProblems.entrySet()) {
                distribution.put(String.valueOf(e.getKey()), e.getValue().size());
            }

            String serialized = new ObjectMapper().writeValueAsString(distribution);
            redisDS.value(String.class).setex(redisKey, cacheTtl, serialized);
            return Response.ok(distribution).build();
        } catch (Exception e) {
            return mapUpstreamError(handle, e);
        }
    }

    /**
     * Maps an exception from an upstream Codeforces call to a meaningful HTTP response.
     * - unknown handle (Codeforces 400 "...not found")  -> 404 Not Found
     * - other Codeforces 400 (bad request)              -> 400 Bad Request
     * - other upstream failures                         -> 502 Bad Gateway
     * - anything else (parsing, timeouts, cache, ...)   -> 500 Internal Server Error
     */
    private Response mapUpstreamError(String handle, Exception e) {
        if (e instanceof WebApplicationException wae && wae.getResponse() != null) {
            int upstreamStatus = wae.getResponse().getStatus();
            String comment = extractUpstreamComment(wae);
            if (comment != null && comment.toLowerCase().contains("not found")) {
                return errorResponse(Response.Status.NOT_FOUND,
                        "Codeforces handle '" + handle + "' not found.");
            }
            if (upstreamStatus == 400) {
                return errorResponse(Response.Status.BAD_REQUEST,
                        comment != null ? comment : "Invalid request to Codeforces for handle '" + handle + "'.");
            }
            return errorResponse(Response.Status.BAD_GATEWAY,
                    "Codeforces API error" + (comment != null ? ": " + comment : "") + ".");
        }
        return errorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                "Unexpected error while processing handle '" + handle + "'.");
    }

    /** Reads the "comment" field from a Codeforces error body, if present. */
    private String extractUpstreamComment(WebApplicationException wae) {
        try {
            String body = wae.getResponse().readEntity(String.class);
            if (body == null || body.isBlank()) return null;
            JsonNode node = new ObjectMapper().readTree(body);
            return node.has("comment") ? node.get("comment").asText() : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    /** Builds a consistent JSON error body: {"status":"error","message":"..."}. */
    private Response errorResponse(Response.Status status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("message", message);
        return Response.status(status).type(MediaType.APPLICATION_JSON).entity(body).build();
    }
}
