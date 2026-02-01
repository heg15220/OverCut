package overcutdebate.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateMessageDao;
import overcutdebate.model.daos.DebateRoomDao;
import overcutdebate.model.daos.DebateRoomParticipantDao;
import overcutdebate.model.entities.*;
import overcutdebate.model.services.exceptions.ApiException;
import overcutdebate.rest.dtos.*;
import overcutdebate.rest.overcut.OvercutUserClient;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DebateRoomServiceImpl implements DebateRoomService {

    private final DebateRoomDao roomDao;
    private final DebateRoomParticipantDao partDao;
    private final OvercutUserClient overcutUserClient;

    @Autowired
    private DebateMessageDao debateMessageDao;

    private final DebateClock clock;

    public DebateRoomServiceImpl(DebateRoomDao roomDao,
                                 DebateRoomParticipantDao partDao,
                                 OvercutUserClient overcutUserClient,
                                 DebateClock clock) {
        this.roomDao = roomDao;
        this.partDao = partDao;
        this.overcutUserClient = overcutUserClient;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailDto getRoom(Long roomId) {
        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));
        return toDetail(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomSummaryDto> listTodayRooms(String scopeStr) {
        DebateScope scope;
        try { scope = DebateScope.valueOf(scopeStr); }
        catch (Exception e) { throw new ApiException(400, "Invalid scope"); }

        LocalDate day = clock.today();
        return roomDao.findByDebateDayAndScopeOrderByJoinDeadlineAsc(day, scope).stream()
                .filter(r -> r.getStatus() != RoomStatus.CLOSED)
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    public JoinRoomResponseDto joinRoom(Long roomId, Long userId, String authHeader) {

        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));

        if (room.getStatus() == RoomStatus.CLOSED) {
            throw new ApiException(409, "Room closed");
        }

        Instant now = clock.nowInstant();
        if (room.getLiveDeadline() != null && !now.isBefore(room.getLiveDeadline())) {
            throw new ApiException(409, "Room expired");
        }

        var existing = partDao.findByRoomIdAndUserId(roomId, userId);
        if (existing.isPresent()) {
            JoinRoomResponseDto dto = new JoinRoomResponseDto();
            dto.joined = true;
            dto.userName = existing.get().getUserName();
            return dto;
        }

        String userName = overcutUserClient.fetchUserNameFromServiceToken(authHeader);
        if (userName == null || userName.isBlank()) userName = "user" + userId;

        DebateRoomParticipant p = new DebateRoomParticipant();
        p.setRoomId(roomId);
        p.setUserId(userId);
        p.setUserName(userName);
        p.setJoinedAt(now);

        partDao.save(p);

        JoinRoomResponseDto dto = new JoinRoomResponseDto();
        dto.joined = true;
        dto.userName = userName;
        return dto;
    }

    @Override
    public void answerPoll(Long roomId, Long userId, String answerStr) {
        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));

        if (room.getStatus() != RoomStatus.POLL) throw new ApiException(409, "Poll not active");

        DebateRoomParticipant p = partDao.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ApiException(403, "You are not joined in this room"));

        PollAnswer ans;
        try { ans = PollAnswer.valueOf(answerStr); }
        catch (Exception e) { throw new ApiException(400, "Invalid poll answer"); }

        p.setPollAnswer(ans);
        p.setPollAnsweredAt(clock.nowInstant());
        partDao.save(p);
    }

    private RoomSummaryDto toSummary(DebateRoom room) {
        RoomSummaryDto dto = new RoomSummaryDto();
        dto.id = room.getId();
        dto.scope = room.getScope().name();
        dto.day = room.getDebateDay().toString();
        dto.topic = room.getTopic();
        dto.status = room.getStatus().name();
        dto.participantsCount = partDao.countByRoomId(room.getId());
        dto.secondsRemainingToJoin = secondsRemaining(room.getJoinDeadline());
        dto.secondsRemainingToPollEnd = room.getPollDeadline() == null ? 0 : secondsRemaining(room.getPollDeadline());
        return dto;
    }

    private RoomDetailDto toDetail(DebateRoom room) {
        RoomDetailDto dto = new RoomDetailDto();
        dto.id = room.getId();
        dto.scope = room.getScope().name();
        dto.day = room.getDebateDay().toString();
        dto.topic = room.getTopic();
        dto.status = room.getStatus().name();
        dto.participantsCount = partDao.countByRoomId(room.getId());
        dto.secondsRemainingToJoin = secondsRemaining(room.getJoinDeadline());
        dto.secondsRemainingToPollEnd = room.getPollDeadline() == null ? 0 : secondsRemaining(room.getPollDeadline());

        dto.participants = partDao.findByRoomId(room.getId()).stream().map(p -> {
            RoomDetailDto.ParticipantDto pd = new RoomDetailDto.ParticipantDto();
            pd.userId = p.getUserId();
            pd.userName = p.getUserName();
            pd.pollAnswer = p.getPollAnswer() == null ? null : p.getPollAnswer().name();
            return pd;
        }).collect(Collectors.toList());

        return dto;
    }

    private long secondsRemaining(Instant deadline) {
        if (deadline == null) return 0;
        long s = Duration.between(clock.nowInstant(), deadline).getSeconds();
        return Math.max(0, s);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRoomLive(Long roomId) {
        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));
        return room.getStatus() == RoomStatus.LIVE;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserJoined(Long roomId, Long userId) {
        return partDao.findByRoomIdAndUserId(roomId, userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageHistoryDto> getRoomMessages(Long roomId, Long userId, int limit) {

        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));

        if (!isUserJoined(roomId, userId)) {
            throw new ApiException(403, "You are not joined in this room");
        }

        int safe = Math.max(1, Math.min(200, limit));

        var msgs = debateMessageDao.findLatestByRoomId(
                roomId,
                org.springframework.data.domain.PageRequest.of(0, safe)
        );

        return msgs.stream()
                .sorted(java.util.Comparator.comparing(DebateMessage::getCreatedAt))
                .map(m -> {
                    ChatMessageHistoryDto dto = new ChatMessageHistoryDto();
                    dto.id = m.getId();
                    dto.roomId = m.getRoomId();
                    dto.userId = m.getUserId();
                    dto.userName = m.getUserName();
                    dto.text = m.getText();
                    dto.createdAt = m.getCreatedAt();
                    return dto;
                })
                .toList();
    }

    // ✅ NUEVO: POST /rooms/{id}/messages
    @Override
    public ChatMessageDto sendMessage(Long roomId, Long userId, String text) {
        DebateRoom room = roomDao.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "Room not found"));

        // política: solo si estás unido
        DebateRoomParticipant p = partDao.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ApiException(403, "You are not joined in this room"));

        // opcional: solo LIVE
        // if (room.getStatus() != RoomStatus.LIVE) throw new ApiException(409, "Room is not live");

        String cleaned = (text == null) ? "" : text.trim();
        if (cleaned.isEmpty() || cleaned.length() > 400) {
            throw new ApiException(400, "Text must be 1..400 chars");
        }

        Instant now = clock.nowInstant();

        DebateMessage m = new DebateMessage();
        m.setRoomId(roomId);
        m.setUserId(userId);
        m.setUserName(p.getUserName());
        m.setText(cleaned);
        m.setCreatedAt(now);

        DebateMessage saved = debateMessageDao.save(m);

        ChatMessageDto dto = new ChatMessageDto();
        dto.id = saved.getId();
        dto.roomId = saved.getRoomId();
        dto.userId = saved.getUserId();
        dto.userName = saved.getUserName();
        dto.text = saved.getText();
        dto.createdAt = saved.getCreatedAt();
        return dto;
    }
}
