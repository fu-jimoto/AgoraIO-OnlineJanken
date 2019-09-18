//画像
var picGameStart = "icons/game_start.png";
var picSelecting = "icons/selecting.png";
var picNotEnough = "icons/not-enough.png";
var picWaiting = "icons/waiting.png";
var picResult = "icons/result.png";

var picRock = "icons/rock.png";
var picScissors = "icons/scissors.png";
var picPaper = "icons/paper.png";

var picWinner = "icons/winner!!.png";
var picLoser = "icons/loser.png";
var picDraw = "icons/draw.png";

//要素
var statusEnter = document.getElementById('enter-gameroom');
var statusNoEnter = document.getElementById('no-enter-gameroom');
var main = document.getElementById("main");
var play_janken_again = document.getElementById("play_janken_again");
var finish_janken_game = document.getElementById("finish_janken_game");
var remote_client1_status = document.getElementById("remote_client1_status");
var remote_client2_status = document.getElementById("remote_client2_status");
var localClientStatus = document.getElementById("local_client_status");
var rock = document.getElementById("rock");
var scissors = document.getElementById("scissors");
var paper = document.getElementById("paper");
var remote_role1 = document.getElementById("remote_role1");
var remote_role2 = document.getElementById("remote_role2");
var local_role = document.getElementById("local_role")

//RTM/ビデオ通話共通
var agoraRTCappId = "";
var channel = "jankenGame";
var uid;

//RTM用
var localRole, remoteRole1, remoteRole2, remoteMessage, mlistLength;
var gameStatus = false;
var entButtunstatus = true;
var roleStatus = false;
var loginStatus = true;
var agoraRTMaccountName;
var agoraRTMclient;
var agoraRTMchannel;

//ビデオ通話用
var channelKey = null;
var localVideo;
var remoteVideo1, remoteVideo2;
var remote;
var stream;
var localStream;
var remoteStream1, remoteStream2;
var videoId1, micId1, videoId2, micId2;
//ミュート機能
var videoMute = false;
var micMute = false;
var speakerMute = false;
//ミュート表示君
var videoIdCheck1, videoIdCheck2, micIdCheck1, micIdCheck2;

//アカウント名をランダムで生成
createAgoraAccount();
function createAgoraAccount(){
    agoraRTMaccountName = Math.random().toString(32).substring(2);
    //uid = agoraRTMaccountName;
    console.log('your account name is' + '【' + agoraRTMaccountName + '】');
}

//AgoraRTM クライアントを初期化
agoraRTMclient = AgoraRTM.createInstance(agoraRTCappId); 

//AgoraRTM チャネルを作成
agoraRTMchannel = agoraRTMclient.createChannel(channel); 

//Set a listener to the connection state change
agoraRTMclient.on('ConnectionStateChange', (newState, reason) => {
  console.log('on connection state changed to ' + newState + ' reason: ' + reason);
});

//誰かが退出したら、自分も退出する
agoraRTMchannel.on('MemberLeft', memberId => {
    console.log(memberId + "is left channle now");
    exitAgoraRTM();
    document.getElementById("login").hidden = false;
    document.getElementById("game").hidden = true;
})

//ページが閉じられるときに、ログアウトする
window.onunload = function(){
    exitAgoraRTM();
}

//ゲーム画面に移動
document.getElementById('enterButton').onclick = function(){
    loginAgoraRTC();

    console.log('now push the enterButton');
    console.log(agoraRTMaccountName);
}

//ログイン
function loginAgoraRTC(){
    agoraRTMclient.login({uid: agoraRTMaccountName}).then(() => {
        gameStatus = false;
        console.log('AgoraRTM client login success');
        channelJoinAgoraRTC();
    }).catch(err => {
         console.log('AgoraRTM client login failure', err);
    });
}

//チャネル参加
function channelJoinAgoraRTC(){
    agoraRTMchannel.join().then(() => {
        console.log('AgoraRTM channel join success');
        enteringMemberCount();
        getChannelMessages();
    }).catch(err => {
        console.log('AgoraRTM channel join failure', err);
    });
}

//チャネル離脱＆ログアウト
function exitAgoraRTM(){
    initGame();
    resetGame();

    document.getElementById("login").hidden = false;
    document.getElementById("game").hidden = true;

    leaveVideoCall();
    agoraRTMchannel.leave();
    agoraRTMclient.logout();
    console.log('channel left and log out');
}

//参加者人数取得
function enteringMemberCount(){
        agoraRTMchannel.getMembers().then(membersList => {
            console.log('menbersList get success ' + membersList);
                if(document.getElementById("game").hidden == true){
                    swichEnterButtonDisplay(membersList);
                }else{
                    roleDisable(membersList);
                }
            console.log(membersList);
        }).catch(err => {
            console.log('menbersList get failure', err);
        });
}

//参加人数が3人以下の場合、入室ボタンを表示
function swichEnterButtonDisplay(mlist){
    console.log("mlist " + mlist);
        if(mlist.length <= 3){
            statusEnter.style.display = "block";
            statusNoEnter.style.display = "none";

            //Switch screens
            document.getElementById("login").hidden = true;
            document.getElementById("game").hidden = false;

            //judge role disable
            roleDisable(mlist);
            console.log("JankenGame play OK");

            startVideoCall();
        }else{
            console.log("JankenGame play NG");
            //exitAgoraRTM();
            agoraRTMchannel.leave();
            agoraRTMclient.logout();
            console.log('channel left and log out');

            statusEnter.style.display = "none";
            statusNoEnter.style.display = "block";
            setTimeout(function(){
                statusEnter.style.display = "block";
                statusNoEnter.style.display = "none";
                },5000);
        }
}

//役ボタンの有効非有効を判定
function roleDisable(mlist){
    console.log("mlist.length is " + mlist.length);

    if(mlist.length == 3){
        //if(roleStatus == true){roleStatus = false;}
        startGame();
        console.log("player is 3");

    }else if(mlist.length == 2){
        //if(roleStatus == true){
            //roleStatus = false;
            main.src = picGameStart;
            main.disabled = "";
        //}
        console.log("player is 2");

    }else if(mlist.length == 1){
        //if(roleStatus == false){
            //roleStatus = true;
            main.src = picNotEnough;
            main.disabled = "disabled";
        //}
        setTimeout(function(){enteringMemberCount()},5000);
        console.log("retry memberlist check");

    }else{
        console.log("ERROR: player is 0 or more 4");
    }
}

//ゲームスタート
function startGame(){
    initGame();
    console.log("Game start");
    agoraRTMchannel.sendMessage({text:"startGame()"}).then(() => {
        console.log("succeed in sending startGame()");
    }).catch(error => {
        console.log("failed to sending startGame()" + error);
    });
}

//ゲーム開始時画面表示
function initGame(){
    main.style.display = "block";
    play_janken_again.style.display = "none";
    finish_janken_game.style.display = "none";

    main.src = picWaiting;
    main.disabled = "disabled";
    remote_client1_status.src = picSelecting;
    remote_client2_status.src = picSelecting;
    localClientStatus.src = picSelecting;

    btnRoleEnable();
    
    remote_role1.src = "";
    remote_role2.src = "";
    local_role.src = "";
    localRole = null;
    remoteRole1 = null;
    remoteRole2 = null;
    gameStatus = true;
    console.log("Game initialized")
}

//ゲームリセット
function resetGame(){
    main.src = picNotEnough;
    btnRoleDisable();
    remote_client1_status.src = "";
    remote_client2_status.src = "";
    local_client_status.src = "";
}

//役ボタン有効
function btnRoleEnable(){
    rock.disabled = "";
    scissors.disabled = "";
    paper.disabled = "";
}

//役ボタン非有効
function btnRoleDisable(){
    rock.disabled = "disabled";
    scissors.disabled = "disabled";
    paper.disabled = "disabled";
}

//じゃんけん(役送信)
function selectLocalRole(role){
    localRole = String(role);
    console.log("typeof localRole is " + typeof localRole);
    console.log("localRole is " + localRole);

    agoraRTMchannel.sendMessage({text:localRole}).then(() => {
        console.log(agoraRTMaccountName + " succeed in sending role: " + localRole);
        local_client_status.src = "icons/fight!.png";
        btnRoleDisable();
        checkMlist();
    }).catch(error => {
        console.log(agoraRTMaccountName + " failed to sending role" + error);
        alert("もう一度選択して下さい。");
    });
}

//メッセージ受信
function getChannelMessages(){
    agoraRTMchannel.on('ChannelMessage', function(message, memberId){
        console.log(agoraRTMaccountName + " got message: " + message.text + " from " + memberId);
        console.log("gameStatus is " + gameStatus);
        remoteMessage = message.text;
        if(remoteMessage == "startGame()" && gameStatus == false){
            startGame();
        }else if(remoteMessage == "1" || remoteMessage == "2" || remoteMessage == "3"){
            remoteMessage = Number(remoteMessage);
            console.log("typeof remoteMessage is " + typeof remoteMessage);
            console.log("remoteMessage is " + remoteMessage);
            getRoles(remoteMessage, memberId);
        }
    });
}

//役取得
function getRoles(remoteMessage, memberId){
    console.log("getRoles() is called");
    console.log("memberId is " + memberId + ", remoteVideo1 is " + remoteVideo1);
    if(memberId == remoteVideo1){
        remoteRole1 = remoteMessage;
        console.log("remoteRole1 is " + remoteRole1);
        remote_client1_status.src = "icons/fight!.png";
    }else{
        remoteRole2 = remoteMessage;
        console.log("remoteRole2 is " + remoteRole2);
        remote_client2_status.src = "icons/fight!.png";
    }
    checkMlist();
}

//参加人数確認
function checkMlist(){
    agoraRTMchannel.getMembers().then(membersList => {
        console.log('menbersList get success ' + membersList);
        mlistLength = membersList.length;
        console.log("mlistLength is " + mlistLength);
    }).catch(err => {
        console.log('menbersList get failure', err);
    });
    console.log("checkMlist() is called");
    if(mlistLength == 2){
        if((localRole != null)&&(remoteRole1 != null)){
            console.log("judgeResult2 is selected");
            judgeResult2(localRole, remoteRole1);
        }else{
            console.log("localRole is " + localRole + ", remoteRole1 is " + remoteRole1);
        }
    }else if(mlistLength == 3){
        if((localRole != null)&&(remoteRole1 != null)&&(remoteRole2 != null)){
            console.log("judgeResult3 is selected");
            judgeResult3(localRole, remoteRole1, remoteRole2);
        }else{
            console.log("localRole is " + localRole + ", remoteRole1 is " + remoteRole1 + ", remoteRole2 is " + remoteRole2);
        }
    }
}

//判定：2人で遊ぶ場合
function judgeResult2(localRole, remoteRole1){
    main.src = "icons/result.png";
    console.log("localRole is " + localRole);
    console.log("remoteRole1 is " + remoteRole1);
    var diff = localRole - remoteRole1;
    console.log("localRole - remoteRole1 = " + diff);

    if(diff == 0){
        result = "あいこ";
        remote_client1_status.src = picDraw;
        local_client_status.src = picDraw;
    }else if(diff == -1 || diff == 2){
        result = "勝ち";
        remote_client1_status.src = picLoser;
        local_client_status.src = picWinner;
    }else{
        result = "負け"
        remote_client1_status.src = picWinner;
        local_client_status.src = picLoser;
    }
    console.log("Result is " + result);

    dispRemoteRole1();
    dispLocalRole();
    gameStatus = false;
    console.log("gameStatus is " + gameStatus);

    setTimeout("moveSelect()", 5000);
}

//判定：3人で遊ぶ場合
function judgeResult3(localRole, remoteRole1, remoteRole2){
    main.src = picResult;
    console.log("localRole is " + localRole);
    console.log("remoteRole1 is " + remoteRole1);
    console.log("remoteRole2 is " + remoteRole2);
    var diff1 = localRole - remoteRole1;
    var diff2 = localRole -remoteRole2; 
    var diff3 = remoteRole1 - remoteRole2;
    console.log("localRole - remoteRole1 = " + diff1);
    console.log("localRole - remoteRole2 = " + diff2);
    console.log("remoteRole1 - remoteRole2 = " + diff3);
    if(((diff1 == 0)&&(diff2 == 0)&&(diff3 == 0))||((localRole != remoteRole1)&&(localRole != remoteRole2)&&(remoteRole1 != remoteRole2))){
        result = "あいこ";
        remote_client1_status.src = picDraw;
        remote_client2_status.src = picDraw;
        local_client_status.src = picDraw;
    }else if(((diff1 == -1)||(diff1 == 2))&&((diff2 == -1)||(diff2 == 2))&&(diff3 == 0)){
        result = "勝ち";
        remote_client1_status.src = picLoser;
        remote_client2_status.src = picLoser;
        local_client_status.src = picWinner;
    }else if((diff1 == 0)&&((diff2 == -1)||(diff2 == 2))&&((diff3 == -1)||(diff3 == 2))){
        result = "勝ち";
        remote_client1_status.src = picWinner;
        remote_client2_status.src = picLoser;
        local_client_status.src = picWinner;
    }else if(((diff1 == -1)||(diff1 == 2))&&(diff2 == 0)){
        result = "勝ち";
        remote_client1_status.src = picLoser;
        remote_client2_status.src = picWinner;
        local_client_status.src = picWinner;
    }else if(diff3 == 0){
        result = "負け";
        remote_client1_status.src = picWinner;
        remote_client2_status.src = picWinner;
        local_client_status.src = picLoser;
    }else if(diff2 == 0){
        result = "負け";
        remote_client1_status.src = picWinner;
        remote_client2_status.src = picLoser;
        local_client_status.src = picLoser;
    }else{
        result = "負け";
        remote_client1_status.src = picLoser;
        remote_client2_status.src = picWinner;
        local_client_status.src = picLoser;
    }
    console.log("Result is " + result);

    dispRemoteRole1();
    dispRemoteRole2();
    dispLocalRole();
    gameStatus = false;
    console.log("gameStatus is " + gameStatus);

    setTimeout("moveSelect()", 5000);    
}

//mainを非表示
//playAgainとfinishGameを表示
function moveSelect(){
    console.log("moveSelect() is called");
    main.style.display = "none";
    play_janken_again.style.display = "block";
    finish_janken_game.style.display = "block";
}

//役表示
function dispRemoteRole1(){
    console.log("dispRemoteRole1() is called, remoteRole1 is " + remoteRole1);
    if(remoteRole1 == 1){
        remote_role1.src = picRock;
    }else if(remoteRole1 == 2){
        remote_role1.src = picScissors;
    }else{
        remote_role1.src = picPaper;
    }
}

function dispRemoteRole2(){
    console.log("dispRemoteRle2() is called, remoteRole2 is " + remoteRole2);
    if(remoteRole2 == 1){
        remote_role2.src = picRock;
    }else if(remoteRole2 == 2){
        remote_role2.src = picScissors;
    }else{
        remote_role2.src = picPaper;
    }
}

function dispLocalRole(){
    console.log("dispLocalRole() is called, localRole is " + localRole);
    if(localRole == 1){
        local_role.src = picRock;
    }else if(localRole == 2){
        local_role.src = picScissors;
    }else{
        local_role.src = picPaper;
    }
}

//もう一度遊ぶ
function playAgain(){
    main.style.display = "block";
    play_janken_again.style.display = "none";
    finish_janken_game.style.display = "none";

    startGame();
    console.log("play janken again");
}

//“おわる”ボタンを押すと、入室画面に移動
function finishGame(){
    loginStatus = false;
    exitAgoraRTM();
    console.log("finish janken");
 }
