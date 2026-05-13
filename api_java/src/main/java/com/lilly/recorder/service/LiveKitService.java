package com.lilly.recorder.service;

import com.lilly.recorder.config.SystemConfigurationProperties;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.EncodedOutputs;
import io.livekit.server.EgressServiceClient;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import livekit.LivekitEgress;
import livekit.LivekitModels;
import livekit.LivekitWebhook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;

@Service
public class LiveKitService {
    private final SystemConfigurationProperties properties;

    public LiveKitService(SystemConfigurationProperties properties) {
        this.properties = properties;
    }

    public LivekitModels.Room createRoom(String roomName) {
        validateRoomName(roomName);
        try {
            RoomServiceClient roomServiceClient = RoomServiceClient.createClient(
                    properties.getLiveKit().getUrl(),
                    properties.getLiveKit().getApiKey(),
                    properties.getLiveKit().getApiSecret()
            );
            return roomServiceClient.createRoom(roomName).execute().body();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to create LiveKit room: " + roomName, ex);
        }
    }

    public void deleteRoom(String roomName) {
        validateRoomName(roomName);
        try {
            RoomServiceClient roomServiceClient = RoomServiceClient.createClient(
                    properties.getLiveKit().getUrl(),
                    properties.getLiveKit().getApiKey(),
                    properties.getLiveKit().getApiSecret()
            );
            roomServiceClient.deleteRoom(roomName).execute();
        } catch (Exception ignored) {
        }
    }

    public String generateToken(String roomName, String participantName, boolean canPublish, boolean canSubscribe, String role) {
        validateRoomName(roomName);
        if (participantName == null || participantName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant name is required");
        }

        AccessToken token = new AccessToken(properties.getLiveKit().getApiKey(), properties.getLiveKit().getApiSecret());
        token.setName(participantName);
        token.setIdentity(participantName);
        token.setMetadata(role);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        if (!canPublish) {
            token.addGrants(new CanPublish(false));
        }
        if (!canSubscribe) {
            token.addGrants(new CanSubscribe(false));
        }
        return token.toJwt();
    }

    public String startRecording(String roomName, String s3Bucket, String s3Key, int width, int height) {
        validateRecordingRequest(roomName, s3Bucket, s3Key, width, height);
        try {
            EgressServiceClient client = EgressServiceClient.createClient(
                    properties.getLiveKit().getUrl(),
                    properties.getLiveKit().getApiKey(),
                    properties.getLiveKit().getApiSecret()
            );

            LivekitEgress.EncodedFileOutput fileOutput = LivekitEgress.EncodedFileOutput.newBuilder()
                    .setFileType(LivekitEgress.EncodedFileType.MP4)
                    .setFilepath(s3Key)
                    .setS3(buildS3Upload(s3Bucket))
                    .build();

            return client.startRoomCompositeEgress(
                    roomName,
                    fileOutput,
                    "grid",
                    null,
                    buildEncodingOptions(width, height),
                    false,
                    false
            ).execute().body().getEgressId();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to start room recording for room: " + roomName, ex);
        }
    }

    public String startParticipantRecording(String roomName, String participantIdentity, String s3Bucket, String s3Key, int width, int height) {
        validateRecordingRequest(roomName, s3Bucket, s3Key, width, height);
        try {
            EgressServiceClient client = EgressServiceClient.createClient(
                    properties.getLiveKit().getUrl(),
                    properties.getLiveKit().getApiKey(),
                    properties.getLiveKit().getApiSecret()
            );

            LivekitEgress.EncodedFileOutput fileOutput = LivekitEgress.EncodedFileOutput.newBuilder()
                    .setFileType(LivekitEgress.EncodedFileType.MP4)
                    .setFilepath(s3Key)
                    .setS3(buildS3Upload(s3Bucket))
                    .build();

            EncodedOutputs outputs = new EncodedOutputs(fileOutput, null, null, null);
            return client.startParticipantEgress(
                    roomName,
                    participantIdentity,
                    outputs,
                    false,
                    null,
                    buildEncodingOptions(width, height)
            ).execute().body().getEgressId();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to start participant recording for participant: " + participantIdentity, ex);
        }
    }

    public LivekitEgress.EgressInfo stopRecording(String egressId) {
        if (egressId == null || egressId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Egress ID is required");
        }
        try {
            EgressServiceClient client = EgressServiceClient.createClient(
                    properties.getLiveKit().getUrl(),
                    properties.getLiveKit().getApiKey(),
                    properties.getLiveKit().getApiSecret()
            );
            return client.stopEgress(egressId).execute().body();
        } catch (Exception ex) {
            String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (message.contains("not found") || message.contains("already ended") || message.contains("does not exist")) {
                return null;
            }
            throw new IllegalStateException("Failed to stop recording for egress: " + egressId, ex);
        }
    }

    public LivekitWebhook.WebhookEvent parseWebhook(String body, String authorizationHeader) {
        try {
            Class<?> receiverClass = Class.forName("io.livekit.server.WebhookReceiver");
            Object receiver = receiverClass.getConstructor(String.class, String.class)
                    .newInstance(properties.getLiveKit().getApiKey(), properties.getLiveKit().getApiSecret());
            Method receive = receiverClass.getMethod("receive", String.class, String.class);
            return (LivekitWebhook.WebhookEvent) receive.invoke(receiver, body, authorizationHeader);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid LiveKit webhook", ex);
        }
    }

    private void validateRoomName(String roomName) {
        if (roomName == null || roomName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room name is required");
        }
    }

    private void validateRecordingRequest(String roomName, String s3Bucket, String s3Key, int width, int height) {
        validateRoomName(roomName);
        if (s3Bucket == null || s3Bucket.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 bucket is required");
        }
        if (s3Key == null || s3Key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 key is required");
        }
        if (width <= 0 || height <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recording resolution must be positive");
        }
    }

    private LivekitEgress.S3Upload buildS3Upload(String bucket) {
        return LivekitEgress.S3Upload.newBuilder()
                .setAccessKey(properties.getS3().getAccessKey())
                .setSecret(properties.getS3().getSecretKey())
                .setBucket(bucket)
                .setEndpoint(properties.getS3().getEndpoint())
                .setRegion(properties.getS3().getRegion())
                .setForcePathStyle(true)
                .build();
    }

    private LivekitEgress.EncodingOptions buildEncodingOptions(int width, int height) {
        int sanitizedWidth = (width / 2) * 2;
        int sanitizedHeight = (height / 2) * 2;
        return LivekitEgress.EncodingOptions.newBuilder()
                .setWidth(sanitizedWidth)
                .setHeight(sanitizedHeight)
                .setFramerate(properties.getRecordingDefaults().getFramerate())
                .setVideoBitrate(properties.getRecordingDefaults().getVideoBitrate())
                .setAudioBitrate(properties.getRecordingDefaults().getAudioBitrate())
                .setAudioFrequency(properties.getRecordingDefaults().getAudioFrequency())
                .build();
    }
}
