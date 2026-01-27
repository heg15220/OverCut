package overcutdebate.model.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateRoomDao;
import overcutdebate.model.daos.DebateRoomParticipantDao;
import overcutdebate.model.entities.*;
import overcutdebate.rest.dtos.*;
import overcutdebate.rest.overcut.OvercutUserClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DebateRoomServiceImpl implements DebateRoomService {

    private final DebateRoomDao roomDao;
    private final DebateRoomParticipantDao partDao;
    private final OvercutUserClient overcutUserClient;

    public DebateRoomServiceImpl(DebateRoomDao roomDao,
                                 DebateRoomParticipantDao partDao,
                                 OvercutUserClient overcutUserClient) {
        this.roomDao = roomDao;
        this.partDao = partDao;
        this.overcutUserClient = overcutUserClient;
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailDto getRoom(Long roomId) {
        DebateRoom room = roomDao.findById(roomId).orElseThrow();
        return toDetail(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomSummaryDto> listRooms(DebateScope scope) {
        return roomDao.findByScopeOrderByJoinDeadlineAsc(scope)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    public RoomDetailDto createRoom(String scopeStr, String topic, Integer joinSeconds) {
        DebateScope scope = DebateScope.valueOf(scopeStr);
        int join = (joinSeconds == null || joinSeconds <= 0) ? 60 : joinSeconds;

        Instant now = Instant.now();

        DebateRoom r = new DebateRoom();
        r.setScope(scope);
        r.setTopic(topic);
        r.setStatus(RoomStatus.OPEN);
        r.setCreatedAt(now);
        r.setJoinDeadline(now.plusSeconds(join));
        r.setPollDeadline(null);
        r.setLiveDeadline(null);

        roomDao.save(r);
        return toDetail(r);
    }

    @Override
    public JoinRoomResponseDto joinRoom(Long roomId, Long userId, String authHeader) {
        DebateRoom room = roomDao.findById(roomId).orElseThrow();

        if (room.getStatus() != RoomStatus.OPEN) {
            throw new IllegalStateException("Room not open");
        }
        if (Instant.now().isAfter(room.getJoinDeadline())) {
            throw new IllegalStateException("Join window closed");
        }

        // ya está unido?
        if (partDao.findByRoomIdAndUserId(roomId, userId).isPresent()) {
            JoinRoomResponseDto dto = new JoinRoomResponseDto();
            dto.joined = true;
            dto.userName = partDao.findByRoomIdAndUserId(roomId, userId).get().getUserName();
            return dto;
        }

        String userName = overcutUserClient.fetchUserNameFromServiceToken(authHeader);
        if (userName == null || userName.isBlank()) userName = "user" + userId;

        DebateRoomParticipant p = new DebateRoomParticipant();
        p.setRoomId(roomId);
        p.setUserId(userId);
        p.setUserName(userName);
        p.setJoinedAt(Instant.now());
        p.setPollAnswer(null);
        p.setPollAnsweredAt(null);

        partDao.save(p);

        JoinRoomResponseDto dto = new JoinRoomResponseDto();
        dto.joined = true;
        dto.userName = userName;
        return dto;
    }

    @Override
    public void answerPoll(Long roomId, Long userId, String answerStr) {
        DebateRoom room = roomDao.findById(roomId).orElseThrow();
        if (room.getStatus() != RoomStatus.POLL) throw new IllegalStateException("Poll not active");

        DebateRoomParticipant p = partDao.findByRoomIdAndUserId(roomId, userId).orElseThrow();
        PollAnswer ans = PollAnswer.valueOf(answerStr);

        p.setPollAnswer(ans);
        p.setPollAnsweredAt(Instant.now());
        partDao.save(p);
    }

    private RoomSummaryDto toSummary(DebateRoom room) {
        RoomSummaryDto dto = new RoomSummaryDto();
        dto.id = room.getId();
        dto.scope = room.getScope().name();
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
        long s = Duration.between(Instant.now(), deadline).getSeconds();
        return Math.max(0, s);
    }
}
