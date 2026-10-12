import { TranslationDocument } from '../types';

export const SAMPLE_DOCUMENTS: TranslationDocument[] = [
  {
    id: 'sample-doc-transformer',
    title: 'Attention Is All You Need (Transformer 架构权威导读)',
    fileName: 'Attention_Is_All_You_Need_v2.pdf',
    fileSize: 2200450,
    fileType: 'pdf',
    pageCount: 15,
    category: '学术科研',
    tags: ['人工智能', '深度学习', 'NLP', '机器翻译'],
    starred: true,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-12T08:30:00.000Z',
    lastSyncAt: '2026-10-12T08:30:00.000Z',
    readingProgress: 42,
    sourceLang: 'en',
    targetLang: 'zh-CN',
    engineUsed: 'academic',
    isOfflineCached: true,
    summary: {
      oneSentenceVerdict: '完全基于自注意力机制建立全局语义依赖，打破序列循环瓶颈并树立高精度机器翻译新基准。',
      abstract: '本文提出了全新的网络架构 Transformer，完全摒弃了传统的循环神经网络（RNN）和卷积网络，完全依赖注意力机制（Attention Mechanisms）建立输入与输出之间的全局依赖。在两项机器翻译任务上展现出显著更高的翻译质量与并行计算效率。',
      sourceAbstract: 'We propose the Transformer, a novel neural architecture solely based on attention mechanisms, dispensing with recurrence and convolutions entirely.',
      keyTakeaways: [
        '彻底取消了序列循环（Recurrence），实现训练过程的高度并行化，大幅缩短训练耗时。',
        '提出了多头自注意力机制（Multi-Head Self-Attention），允许模型在不同子空间联合关注不同位置的上下文表征。',
        '在 WMT 2014 英语-德语翻译任务上刷新了 BLEU 评分达到 28.4，创造全新基准。',
        '引入正弦位置编码（Positional Encoding）有效注入序列顺序信息。'
      ],
      actionItems: [
        '在大规模多语言翻译场景中推荐使用 Transformer 变体以获取最佳吞吐量与语义精度。',
        '建议注意长文本上下文在二次方自注意力机制下的显存消耗优化方案。'
      ],
      category: '学术科研',
      keywords: ['Transformer', 'Self-Attention', 'Multi-Head Attention', 'Positional Encoding', 'BLEU', 'Encoder-Decoder'],
      readingTimeMinutes: 12,
      difficulty: '高精尖',
      targetAudience: '算法研究员、NLP工程师、AI学者'
    },
    glossary: [
      {
        id: 'term-1',
        term: 'Transformer',
        translation: 'Transformer 模型 / 变形器架构',
        explanation: '一种基于自注意力机制的深度神经网络架构，取代传统的循环序列模型。',
        category: 'technical',
        highlighted: true,
      },
      {
        id: 'term-2',
        term: 'Multi-Head Attention',
        translation: '多头注意力机制',
        explanation: '将查询、键和值投影到多个不同子空间并行计算注意力，捕捉多维度语义关联。',
        category: 'technical',
        highlighted: true,
      },
      {
        id: 'term-3',
        term: 'Scaled Dot-Product',
        translation: '缩放点积',
        explanation: '将点积结果除以维度平方根，防止点积过大导致 softmax 梯度极度变小。',
        category: 'academic',
        highlighted: true,
      },
      {
        id: 'term-4',
        term: 'Positional Encoding',
        translation: '位置编码',
        explanation: '由于缺少循环结构，使用正弦与余弦周期函数显式注入 Token 的绝对和相对位置信息。',
        category: 'technical',
        highlighted: true,
      },
      {
        id: 'term-5',
        term: 'BLEU score',
        translation: 'BLEU 评估基准分数',
        explanation: '双语评估替用指标（Bilingual Evaluation Understudy），机器翻译译文精确度的主流评价度量。',
        category: 'academic',
        highlighted: true,
      }
    ],
    segments: [
      {
        id: 'seg-1',
        pageNumber: 1,
        type: 'title',
        original: 'Attention Is All You Need',
        translated: '注意力就是你所需的一切（Attention Is All You Need）',
      },
      {
        id: 'seg-2',
        pageNumber: 1,
        type: 'heading',
        original: 'Abstract',
        translated: '摘要',
      },
      {
        id: 'seg-3',
        pageNumber: 1,
        type: 'paragraph',
        original: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism.',
        translated: '当前主流的序列转导模型主要基于编码器-解码器架构中复杂的循环神经网络或卷积神经网络。性能最优的模型通常通过注意力机制来关联编码器与解码器。',
      },
      {
        id: 'seg-4',
        pageNumber: 1,
        type: 'paragraph',
        original: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
        translated: '我们提出了一种全新的简洁网络架构——Transformer，它完全依赖注意力机制，彻底摒弃了循环和卷积结构。在两项机器翻译任务上的实验表明，该模型在翻译质量上更胜一筹，同时具备更强的并行处理能力，并大幅减少了训练所需的时间。',
      },
      {
        id: 'seg-5',
        pageNumber: 1,
        type: 'heading',
        original: '1. Introduction',
        translated: '1. 引言',
      },
      {
        id: 'seg-6',
        pageNumber: 1,
        type: 'paragraph',
        original: 'Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t-1} and the input for position t.',
        translated: '循环模型通常沿着输入和输出序列的符号位置进行分解计算。通过将位置与计算时间步对齐，它们根据前一个隐藏状态 h_{t-1} 与当前位置 t 的输入生成一系列隐藏状态 h_t。',
      },
      {
        id: 'seg-7',
        pageNumber: 2,
        type: 'paragraph',
        original: 'This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Recent work has achieved significant improvements in computational efficiency through factorization tricks and conditional computation, yet the fundamental constraint of sequential computation remains.',
        translated: '这种固有的顺序计算本质阻碍了训练样本内部的并行化；当序列长度增加时，这一缺陷尤为严重，因为内存瓶颈会极大限制批处理规模。尽管近期的研究通过因子分解技巧和条件计算显著改善了计算效率，但顺序计算的根本限制依然存在。',
      },
      {
        id: 'seg-8',
        pageNumber: 2,
        type: 'heading',
        original: '2. Multi-Head Attention',
        translated: '2. 多头注意力机制（Multi-Head Attention）',
      },
      {
        id: 'seg-9',
        pageNumber: 2,
        type: 'paragraph',
        original: 'Instead of performing a single attention function with d_model-dimensional queries, keys and values, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively.',
        translated: '与使用 d_model 维度的查询、键和值执行单一注意力函数相比，我们发现将查询、键和值分别通过不同的可学习线性投影，h 次线性映射至 d_k、d_k 和 d_v 维度更为有利。',
      },
      {
        id: 'seg-10',
        pageNumber: 2,
        type: 'paragraph',
        original: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this capability.',
        translated: '多头注意力机制使模型能够同时关注来自不同位置、不同表示子空间的信息。而在单头注意力机制中，平均化操作会削弱这种跨维度的信息捕获能力。',
      }
    ]
  },
  {
    id: 'sample-doc-contract',
    title: 'Cross-Border Master Service Agreement (跨境技术出海采购服务合同)',
    fileName: 'Global_SaaS_License_Agreement_2026.pdf',
    fileSize: 1450200,
    fileType: 'pdf',
    pageCount: 8,
    category: '商务法务',
    tags: ['商务合同', '跨境出海', 'SLA', '知识产权'],
    starred: true,
    createdAt: '2026-10-11T14:20:00.000Z',
    updatedAt: '2026-10-12T04:10:00.000Z',
    lastSyncAt: '2026-10-12T04:10:00.000Z',
    readingProgress: 65,
    sourceLang: 'en',
    targetLang: 'zh-CN',
    engineUsed: 'business',
    isOfflineCached: true,
    summary: {
      abstract: '本主服务协议确立了云端企业级软件服务的采购、交付、数据安全及责任限额条款。双方严格约定了 99.9% 的系统可用性（SLA）以及跨境数据合规与知识产权归属。',
      keyTakeaways: [
        '明确各方权利义务，甲方向乙方提供企业级高可用 SaaS 授权。',
        '服务等级协议（SLA）确立月度可用性低于 99.9% 时的阶梯式服务点数补偿方案。',
        '包含完备的不可抗力条款（Force Majeure）与赔偿免责机制（Indemnification）。',
        '争议解决指定国际仲裁中心管辖，适用准据法明确。'
      ],
      actionItems: [
        '法务部门重点关注第 8 条责任上限（Limitation of Liability）不超过前 12 个月累计支付款项。',
        '安全合规团队需对接 GDPR 及出海数据跨境传输补充协议（DPA）。'
      ],
      category: '商务法务',
      keywords: ['Master Service Agreement', 'Indemnification', 'Force Majeure', 'Service Level Agreement', 'Confidentiality'],
      readingTimeMinutes: 8,
      difficulty: '专业级',
      targetAudience: '企业法务顾问、商务总监、采购经理'
    },
    glossary: [
      {
        id: 'term-c1',
        term: 'Indemnification',
        translation: '补偿与免责保障',
        explanation: '一方同意为另一方因特定侵权或违约引起的第三方索赔承担法律赔偿责任。',
        category: 'business',
        highlighted: true,
      },
      {
        id: 'term-c2',
        term: 'Force Majeure',
        translation: '不可抗力',
        explanation: '无法预见、无法避免且无法克服的客观事件（如极端天灾、政府禁令），免除部分履约责任。',
        category: 'business',
        highlighted: true,
      },
      {
        id: 'term-c3',
        term: 'SLA Uptime',
        translation: '服务正常运行率（SLA）',
        explanation: '保障系统保持可用与正常运转的时间比例（本合同约定不低于 99.9%）。',
        category: 'technical',
        highlighted: true,
      }
    ],
    segments: [
      {
        id: 'seg-c1',
        pageNumber: 1,
        type: 'title',
        original: 'MASTER CLOUD SERVICES & ENTERPRISE LICENSE AGREEMENT',
        translated: '企业级云服务与主许可协议',
      },
      {
        id: 'seg-c2',
        pageNumber: 1,
        type: 'heading',
        original: 'Section 4. Service Level Commitments and Remedies',
        translated: '第 4 条：服务等级承诺（SLA）与违约救济措施',
      },
      {
        id: 'seg-c3',
        pageNumber: 1,
        type: 'paragraph',
        original: 'Provider warrants that the Enterprise Services will maintain a Monthly Uptime Percentage of not less than 99.9% during each calendar billing cycle. If Provider fails to meet this SLA Commitment, Customer shall be eligible for Service Credits proportional to the downtime duration.',
        translated: '服务商保证在每个日历账单周期内，企业级服务将维持不低于 99.9% 的月度正常运行时间比率。若服务商未能达到该 SLA 承诺，客户有权根据服务中断时长申请等比例的服务抵扣点数（Service Credits）。',
      },
      {
        id: 'seg-c4',
        pageNumber: 1,
        type: 'heading',
        original: 'Section 9. Indemnification & Limitation of Liability',
        translated: '第 9 条：赔偿保障与责任限制',
      },
      {
        id: 'seg-c5',
        pageNumber: 1,
        type: 'paragraph',
        original: 'To the maximum extent permitted by applicable law, neither party shall be liable for any indirect, incidental, punitive, or consequential damages. The aggregate liability of either party arising out of or related to this Agreement shall not exceed the total amount paid by Customer hereunder in the twelve (12) months preceding the incident.',
        translated: '在适用法律允许的最大范围内，任何一方均不对任何间接性、附带性、惩罚性或后果性损害承担责任。任何一方因本协议引起或与本协议相关的累计责任总额，均不得超过该事故发生前十二（12）个月内客户依照本协议实际支付的款项总额。',
      }
    ]
  },
  {
    id: 'sample-doc-ocr',
    title: 'Laboratory Sensor Calibration Sheet (智能OCR扫描测试件)',
    fileName: 'Scanned_Calibration_Report_BatchA9.png',
    fileSize: 3120000,
    fileType: 'ocr_scan',
    pageCount: 3,
    category: '技术手册',
    tags: ['OCR识别', '扫描件', '传感器标定', '技术规范'],
    starred: false,
    createdAt: '2026-10-12T01:15:00.000Z',
    updatedAt: '2026-10-12T02:00:00.000Z',
    lastSyncAt: '2026-10-12T02:00:00.000Z',
    readingProgress: 100,
    sourceLang: 'en',
    targetLang: 'zh-CN',
    engineUsed: 'gemini-flash',
    ocrConfidence: 0.985,
    isOfflineCached: true,
    summary: {
      abstract: '该文档由光学高精度 OCR 引擎从倾斜模糊的纸质试验室标定单中精准还原。内容包含高低温环境下压电传感器在 20Hz 至 10kHz 频率响应曲线的基准测试数据。',
      keyTakeaways: [
        'OCR 布局分析成功保留了原始试验参数表格与容差阈值定义。',
        '零点漂移率（Zero Drift）测定值为 ±0.03% FS/℃，达到工业 I 类精密标定标准。',
        '双语对照模式已将电气测量学术词条与公差单位精准对齐。'
      ],
      actionItems: ['复核高频段谐振尖峰（Resonant Peak）是否处于预设机械隔离阻尼带宽内。'],
      category: '技术手册',
      keywords: ['Piezoelectric Sensor', 'Calibration Matrix', 'Zero Drift', 'Frequency Response', 'Tolerance'],
      readingTimeMinutes: 5,
      difficulty: '专业级',
      targetAudience: '仪器工程师、硬件测试人员、质检工程师'
    },
    glossary: [
      {
        id: 'term-o1',
        term: 'Piezoelectric Sensor',
        translation: '压电式传感器',
        explanation: '利用某些介质材料的压电效应进行受力与振动信号转换的高响应度传感器。',
        category: 'technical',
        highlighted: true,
      },
      {
        id: 'term-o2',
        term: 'Zero Drift',
        translation: '零点漂移',
        explanation: '传感器在无输入或恒定基准状态下，输出值随时间或环境温度产生的微弱缓慢偏离。',
        category: 'technical',
        highlighted: true,
      }
    ],
    segments: [
      {
        id: 'seg-o1',
        pageNumber: 1,
        type: 'title',
        original: 'TECHNICAL CALIBRATION CERTIFICATE & TEST REPORT',
        translated: '技术标定检验证书及测试报告（OCR识别件）',
      },
      {
        id: 'seg-o2',
        pageNumber: 1,
        type: 'paragraph',
        original: 'Device Under Test: Ultra-precision High Frequency Accelerometer Model AC-9800. Serial Number: 2026-XYZ-8812. Inspection Date: October 10, 2026.',
        translated: '受检设备：超高精度高频压电加速度计 型号 AC-9800。出厂编号：2026-XYZ-8812。检测日期：2026年10月10日。',
      },
      {
        id: 'seg-o3',
        pageNumber: 1,
        type: 'table_row',
        original: 'Parameter: Sensitivity (100 Hz, 5g) | Measured: 10.02 mV/g | Tolerance Limit: 10.00 ± 0.15 mV/g | Status: PASS',
        translated: '参数：灵敏度 (100 Hz, 5g) | 实测值：10.02 mV/g | 容差限额：10.00 ± 0.15 mV/g | 判定：合格',
      },
      {
        id: 'seg-o4',
        pageNumber: 1,
        type: 'paragraph',
        original: 'Calibration condition: Ambient temperature 23.4°C, Relative Humidity 46.2%. The instrument demonstrated outstanding thermal repeatability with negligible zero drift under continuous 72-hour thermal cycling.',
        translated: '标定环境：环境温度 23.4°C，相对湿度 46.2%。该仪器在连续 72 小时温度循环测试中展现出卓越的热重复性，零点漂移可忽略不计。',
      }
    ]
  }
];
