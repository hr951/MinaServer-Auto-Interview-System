global.ReadableStream = require('stream/web').ReadableStream;
global.crypto = require('crypto');

require("./server.js");

const { Client, GatewayIntentBits, Collection, ActivityType, Partials, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, Permissions, PermissionsBitField, AttachmentBuilder, StringSelectMenuBuilder, InteractionResponse, StringSelectMenuOptionBuilder } = require("discord.js");
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User
  ]
});

const token = process.env.DISCORD_BOT_TOKEN;
const color = "#FFFFFF";
let interview = {};
const answer_prefix = [
  "面接受付番号",
  "ユーザーネーム",
  "Minecraft ID",
  "参加頻度",
  "あなたの強み",
  "PCのスペック",
  "その他",
  "生年月日",
  "職業",
  "OBS使用可否",
  "VC使用可否",
  "YouTuberか",
  "他のグループに所属しているか"
];

function disabled_button(msg, tf) {
  const ok = new ButtonBuilder()
    .setCustomId(`ok`)
    .setStyle(ButtonStyle.Success)
    .setLabel("採用")
    .setDisabled(true);
  const ng = new ButtonBuilder()
    .setCustomId(`ng`)
    .setStyle(ButtonStyle.Danger)
    .setLabel("不採用")
    .setDisabled(true);
  const question = new ButtonBuilder()
    .setCustomId(`question`)
    .setStyle(ButtonStyle.Secondary)
    .setLabel("質問")
    .setDisabled(true);
  if (tf) {
    tf_name = "採用";
  } else {
    tf_name = "不採用";
  }
  msg.edit({ content: "# " + tf_name + "\n~~" + msg.content + "~~", components: [new ActionRowBuilder().addComponents(ok, ng, question)] });
}

function disabled_button2(msg) {
  const answer = new ButtonBuilder()
    .setCustomId(`answer`)
    .setStyle(ButtonStyle.Secondary)
    .setLabel("回答する")
    .setDisabled(true);
  msg.edit({ content: "~~" + msg.content + "~~", components: [new ActionRowBuilder().addComponents(answer)] });
}

client.on('ready', () => {
  setInterval(() => {
    client.user.setPresence({
      activities: [
        {
          name: `面接中`,
          //name: "メンテナンス",
          type: ActivityType.Competing
        }
      ],
      status: `dnd`//online : いつもの, dnd : 赤い奴, idle : 月のやつ, invisible : 表示なし
    });


  }, 1000);
});

//ここから

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guildId) {
    const author = message.author;
    const content = message.content;
    if (content === "面接開始") {
      const Button = new ButtonBuilder()
        .setCustomId(`mensetu`)
        .setStyle(ButtonStyle.Primary)
        .setLabel("面接開始");

      const emb = new EmbedBuilder()
        .setTitle("Minachan鯖 自動面接 注意事項")
        .setDescription(`**${author.displayName}**さん、こんにちは！\nこちらは **Minachan鯖 自動面接システム** です。\n以下の注意事項をご確認のうえ、「面接開始」ボタンを押してください。\n### 注意事項\n - 自動面接にて送信された情報はすべて当面接のみに使用されます。また、送信された情報は当面接が終わり次第システム上から完全に削除されます。\n - 以下の「面接開始」ボタンを押した時点で以上の注意事項に同意したものとします。\n - ご回答いただいた内容によっては追って連絡する可能性がありますので、慎重に回答してください。\n - 回答中に再度「面接開始」ボタンを押した場合すべての回答がリセットされます。`)
        .setColor(color);

      message.reply({ embeds: [emb], components: [new ActionRowBuilder().setComponents(Button)] });
    } else {
      message.reply("こんにちは！\nこちらは **Minachan鯖 自動面接システム** です。\n面接を開始する場合は「面接開始」と送信してください！");
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === "mensetu") {
      const first_modal = new ModalBuilder()
        .setTitle("Minachan鯖 面接フォーム")
        .setCustomId("mensetu_form1");
      const Java_ID = new TextInputBuilder()
        .setLabel("Minecraft Java版 のIDを教えてください。（必須）")
        .setCustomId("java_id")
        .setStyle("Short")
        .setPlaceholder("Example_ID")
        .setMaxLength(100)
        .setMinLength(1)
        .setRequired(true);
      const join = new TextInputBuilder()
        .setLabel("参加できる頻度を教えてください。（必須）")
        .setCustomId("join")
        .setStyle("Paragraph")
        .setPlaceholder("毎週土・日曜日 15:00~19:00 など")
        .setMaxLength(1000)
        .setMinLength(1)
        .setRequired(true);
      const point = new TextInputBuilder()
        .setLabel("あなたの強みを教えてください。（必須）")
        .setCustomId("point")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(true);
      const spec = new TextInputBuilder()
        .setLabel("PCのスペックを教えてください。（任意）")
        .setCustomId("spec")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(false);
      const any = new TextInputBuilder()
        .setLabel("その他に何かあればご入力ください。（任意）")
        .setCustomId("any")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(false);

      interview[interaction.user.id] = [];

      const first_action = new ActionRowBuilder().setComponents(Java_ID);
      const second_action = new ActionRowBuilder().setComponents(join);
      const third_action = new ActionRowBuilder().setComponents(point);
      const forth_action = new ActionRowBuilder().setComponents(spec);
      const fifth_action = new ActionRowBuilder().setComponents(any);

      first_modal.setComponents(first_action, second_action, third_action, forth_action, fifth_action);

      interaction.showModal(first_modal);
    } else if (interaction.customId.startsWith("ok")) {

      const index = interaction.customId.indexOf("_");

      const ok_check = new ModalBuilder()
        .setTitle("二重確認")
        .setCustomId(`okform_${interaction.customId.substring(index + 1)}`);
      const ok_content = new TextInputBuilder()
        .setLabel("「採用」と入力してください。")
        .setCustomId("ok_content")
        .setStyle("Short")
        .setMaxLength(2)
        .setMinLength(2)
        .setRequired(true);

      const ok_content_action = new ActionRowBuilder().setComponents(ok_content);

      ok_check.setComponents(ok_content_action);

      interaction.showModal(ok_check);
    } else if (interaction.customId.startsWith("ng")) {

      const index = interaction.customId.indexOf("_");

      const ng_reason_modal = new ModalBuilder()
        .setTitle("不採用理由")
        .setCustomId(`ngform_${interaction.customId.substring(index + 1)}`);
      const ng_reason = new TextInputBuilder()
        .setLabel("なぜ不採用なのですか？（必須）")
        .setCustomId("ng_reason")
        .setStyle("Paragraph")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(true);

      const ng_reason_action = new ActionRowBuilder().setComponents(ng_reason);

      ng_reason_modal.setComponents(ng_reason_action);

      interaction.showModal(ng_reason_modal);
    } else if (interaction.customId.startsWith("question")) {

      const index = interaction.customId.indexOf("_");

      const question_modal = new ModalBuilder()
        .setTitle("質問")
        .setCustomId(`qform_${interaction.customId.substring(index + 1)}`);
      const question_content = new TextInputBuilder()
        .setLabel("質問内容を記述してください。（必須）")
        .setCustomId("question_content")
        .setStyle("Paragraph")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(true);

      const question_action = new ActionRowBuilder().setComponents(question_content);

      question_modal.setComponents(question_action);

      interaction.showModal(question_modal);
    } else if (interaction.customId.startsWith("answerq")) {

      const index = interaction.customId.indexOf("_");

      const answer_modal = new ModalBuilder()
        .setTitle("回答")
        .setCustomId(`answerform_${interaction.customId.substring(index + 1)}`);
      const answer_content = new TextInputBuilder()
        .setLabel("回答を記述してください。（必須）")
        .setCustomId("answer_content")
        .setStyle("Paragraph")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(true);

      const answer_action = new ActionRowBuilder().setComponents(answer_content);

      answer_modal.setComponents(answer_action);

      interaction.showModal(answer_modal);
    } else if (interaction.customId === "form2") {

      const second_modal = new ModalBuilder()
        .setTitle("Minachan鯖 面接フォーム2")
        .setCustomId("mensetu_form2");
      const birth = new TextInputBuilder()
        .setLabel("生年月日を教えてください。（必須）")
        .setCustomId("birth")
        .setStyle("Short")
        .setPlaceholder("2000/01/01")
        .setMaxLength(100)
        .setMinLength(1)
        .setRequired(true);
      /*const join = new TextInputBuilder()
        .setLabel("参加できる頻度を教えてください。（必須）")
        .setCustomId("join")
        .setStyle("Paragraph")
        .setPlaceholder("毎週土・日曜日 15:00~19:00 など")
        .setMaxLength(1000)
        .setMinLength(1)
        .setRequired(true);
      const point = new TextInputBuilder()
        .setLabel("あなたの強みを教えてください。（必須）")
        .setCustomId("point")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(true);
      const spec = new TextInputBuilder()
        .setLabel("PCのスペックを教えてください。（任意）")
        .setCustomId("spec")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(false);
      const any = new TextInputBuilder()
        .setLabel("その他に何かあればご入力ください。（任意）")
        .setCustomId("any")
        .setStyle("Paragraph")
        .setPlaceholder(" ")
        .setMaxLength(4000)
        .setMinLength(1)
        .setRequired(false);*/

      const first_action = new ActionRowBuilder().setComponents(birth);
      /*const second_action = new ActionRowBuilder().setComponents(join);
      const third_action = new ActionRowBuilder().setComponents(point);
      const forth_action = new ActionRowBuilder().setComponents(spec);
      const fifth_action = new ActionRowBuilder().setComponents(any);*/

      second_modal.setComponents(first_action);

      await interaction.showModal(second_modal);

    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId == "mensetu_form1") {

      const java_id = interaction.fields.getTextInputValue("java_id");
      const join = interaction.fields.getTextInputValue("join");
      const point = interaction.fields.getTextInputValue("point");
      const spec = interaction.fields?.getTextInputValue("spec");
      const any = interaction.fields?.getTextInputValue("any");
      const id = interaction.user.id;
      const username = interaction.user.username;

      interview[id][0] = id;
      interview[id][1] = username;
      interview[id][2] = java_id;
      interview[id][3] = join;
      interview[id][4] = point;
      interview[id][5] = spec ? spec : "無回答";
      interview[id][6] = any ? any : "無回答";

      const form2_button = new ButtonBuilder()
        .setCustomId("form2")
        .setLabel("次へ進む")
        .setStyle(ButtonStyle.Primary);

      await interaction.reply({ content: "次のフォームへ進みます。", components: [new ActionRowBuilder().setComponents(form2_button)] });

    } else if (interaction.customId == "mensetu_form2") {
      const birth = interaction.fields.getTextInputValue("birth");
      const id = interaction.user.id;

      interview[id][7] = birth;

      const job = new StringSelectMenuBuilder()
        .setCustomId("job")
        .setPlaceholder("職業を選択してください。")
        .addOptions(
          {
            label: "小学生以下",
            value: "0",
          },
          {
            label: "中学生",
            value: "1",
          },
          {
            label: "高校生",
            value: "2",
          },
          {
            label: "大学生",
            value: "3",
          },
          {
            label: "社会人",
            value: "4",
          },
          {
            label: "その他",
            value: "5",
          }
        );
      const obs = new StringSelectMenuBuilder()
        .setCustomId("obs")
        .setPlaceholder("OBSを使用できますか？")
        .addOptions(
          {
            label: "可能",
            value: "0",
          },
          {
            label: "不可能",
            value: "1",
          }
        );
      const vc = new StringSelectMenuBuilder()
        .setCustomId("vc")
        .setPlaceholder("VC(ボイスチャット)は可能ですか？")
        .addOptions(
          {
            label: "可能",
            value: "0",
          },
          {
            label: "不可能",
            value: "1",
          }
        );
      const yt = new StringSelectMenuBuilder()
        .setCustomId("yt")
        .setPlaceholder("YouTuberですか？")
        .addOptions(
          {
            label: "はい",
            value: "0",
          },
          {
            label: "いいえ",
            value: "1",
          }
        );
      const group = new StringSelectMenuBuilder()
        .setCustomId("group")
        .setPlaceholder("他のグループに所属していますか？")
        .addOptions(
          {
            label: "はい",
            value: "0",
          },
          {
            label: "いいえ",
            value: "1",
          }
        );

      const select_1 = new ActionRowBuilder().addComponents(job);
      const select_2 = new ActionRowBuilder().addComponents(obs);
      const select_3 = new ActionRowBuilder().addComponents(vc);
      const select_4 = new ActionRowBuilder().addComponents(yt);
      const select_5 = new ActionRowBuilder().addComponents(group);

      await interaction.message.delete();

      await interaction.reply({
        content: "回答ありがとうございました。\n最後に以下の選択形式の質問を5つ回答してください。",
        components: [select_1, select_2, select_3, select_4, select_5],
        ephemeral: false
      });

    } else if (interaction.customId.startsWith("ngform")) {
      const reason = interaction.fields.getTextInputValue("ng_reason");
      try {
        const index = interaction.customId.indexOf("_");
        const ng_msg = await client.users.cache.get(interaction.customId.substring(index + 1)).send(`# 選考結果のお知らせ\nこのたびは、Minachan鯖メンバー募集にご応募いただきありがとうございました。\n\n慎重に選考を行った結果、まことに残念ながら今回についてはご期待に添えない結果となりました。\nなにとぞご容赦いただければ幸甚に存じます。\nなお、ご期待に添えない結果となった理由は以下に記してある通りとなります。\n` + '```' + reason + '```');
        disabled_button(interaction.message, false);
        interaction.reply({ content: "不採用メッセージを送信しました。", ephemeral: true });
      } catch (error) {
        console.error('メッセージの送信中にエラーが発生しました:\n', error);
        interaction.reply({ content: "メッセージの送信中にエラーが発生しました。", ephemeral: true });
      }
    } else if (interaction.customId.startsWith("qform")) {
      const question = interaction.fields.getTextInputValue("question_content");
      try {
        const index = interaction.customId.indexOf("_");

        const answer_q = new ButtonBuilder()
          .setCustomId(`answerq_${interaction.customId.substring(index + 1)}`)
          .setStyle(ButtonStyle.Secondary)
          .setLabel("回答する");

        const question_msg = await client.users.cache.get(interaction.customId.substring(index + 1)).send({ content: `### 以下の質問は面接にて聞けなかった箇所についての質問です。\n誤りがないように回答してください。\n` + '```' + question + '```', components: [new ActionRowBuilder().setComponents(answer_q)] });
        interaction.reply({ content: "質問メッセージを送信しました。", ephemeral: true });
      } catch (error) {
        console.error('メッセージの送信中にエラーが発生しました:\n', error);
        interaction.reply({ content: "メッセージの送信中にエラーが発生しました。", ephemeral: true });
      }
    } else if (interaction.customId.startsWith("answerform")) {
      const answer = interaction.fields.getTextInputValue("answer_content");
      try {
        const index = interaction.customId.indexOf("_");
        await client.channels.cache.get("1448298405569761380").send({ content: "# 質問に対する回答が届きました！\n面接受付番号: " + interaction.customId.substring(index + 1) + "\n" + '```' + answer + '```' });
        disabled_button2(interaction.message);
        interaction.reply({ content: "回答メッセージを送信しました。", ephemeral: true });
      } catch (error) {
        console.error('メッセージの送信中にエラーが発生しました:\n', error);
        interaction.reply({ content: "メッセージの送信中にエラーが発生しました。", ephemeral: true });
      }
    } else if (interaction.customId.startsWith("okform")) {
      const ok_content = interaction.fields.getTextInputValue("ok_content");
      if (ok_content === "採用") {
        try {
          const index = interaction.customId.indexOf("_");
          const ok_msg = await client.users.cache.get(interaction.customId.substring(index + 1)).send(`# 選考結果のお知らせ\nこのたびは、Minachan鯖 メンバー募集にご応募いただきありがとうございました。\n\n慎重に選考を行った結果、貴殿の採用が決定いたしましたのでご通知申し上げます。\nつきましては、以下のリンクよりMinachan鯖 Discordサーバーにご参加ください。\n[Minachan鯖 Discordサーバー](https://discord.gg/PstjZXMkfy)`);
          disabled_button(interaction.message, true);
          interaction.reply({ content: "採用メッセージを送信しました。", ephemeral: true });
        } catch (error) {
          console.error('メッセージの送信中にエラーが発生しました:\n', error);
          interaction.reply({ content: "メッセージの送信中にエラーが発生しました。", ephemeral: true });
        }
      } else {
        interaction.reply({ content: "二重確認に失敗しました。", ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "job") {
      const value = interaction.values[0];
      const job_name = {
        0: "小学生以下",
        1: "中学生",
        2: "高校生",
        3: "大学生",
        4: "社会人",
        5: "その他"
      };
      interview[interaction.user.id][8] = await job_name[value];
      await interaction.reply({ content: `${job_name[value]}を設定しました。`, ephemeral: true });
    } else if (interaction.customId === "obs") {
      const value = interaction.values[0];
      const tf_name = {
        0: "可能",
        1: "不可能"
      };
      interview[interaction.user.id][9] = await tf_name[value];
      await interaction.reply({ content: `${tf_name[value]}を設定しました。`, ephemeral: true });
    } else if (interaction.customId === "vc") {
      const value = interaction.values[0];
      const tf_name = {
        0: "可能",
        1: "不可能"
      };
      interview[interaction.user.id][10] = await tf_name[value];
      await interaction.reply({ content: `${tf_name[value]}を設定しました。`, ephemeral: true });
    } else if (interaction.customId === "yt") {
      const value = interaction.values[0];
      const tf_name = {
        0: "はい",
        1: "いいえ"
      };
      interview[interaction.user.id][11] = await tf_name[value];
      await interaction.reply({ content: `${tf_name[value]}を設定しました。`, ephemeral: true });
    } else if (interaction.customId === "group") {
      const value = interaction.values[0];
      const tf_name = {
        0: "はい",
        1: "いいえ"
      };
      interview[interaction.user.id][12] = await tf_name[value];
      await interaction.reply({ content: `${tf_name[value]}を設定しました。`, ephemeral: true });
    }
    if (interview[interaction.user.id].filter(v => v !== undefined).length === 13) {
      await interaction.message.delete();
      await interaction.channel.send("お疲れさまでした！\n面接は以上となります。\n合否通知は当システムを通して行わせていただきます。\nまた、以下の通り回答を送信しましたので、もし回答を修正する場合は、再度「面接開始」から行ってください。\n### 回答内容\n" + '```' + interview[interaction.user.id].map((answer, index) => `${answer_prefix[index]}: ${answer}`).join("\n") + '```');

      const ok = new ButtonBuilder()
        .setCustomId(`ok_${interaction.user.id}`)
        .setStyle(ButtonStyle.Success)
        .setLabel("採用");
      const ng = new ButtonBuilder()
        .setCustomId(`ng_${interaction.user.id}`)
        .setStyle(ButtonStyle.Danger)
        .setLabel("不採用");
      const question = new ButtonBuilder()
        .setCustomId(`question_${interaction.user.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel("質問");
      await client.channels.cache.get("1448298405569761380").send({ content: "# 回答が届きました！\n" + '```' + interview[interaction.user.id].map((answer, index) => `${answer_prefix[index]}: ${answer}`).join("\n") + '```', components: [new ActionRowBuilder().setComponents(ok, ng, question)] });
    }
  }
});

client.login(token);
