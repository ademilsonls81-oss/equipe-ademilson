"use client";
import { useState } from "react";
import styles from "./FAQ.module.css";

const faqs = [
  {
    q: "Preciso ter experiência para participar?",
    a: "Não é necessário ter experiência prévia em gravação ou em projetos de IA. A equipe orienta sobre como funciona e o que cada projeto exige. O importante é seguir exatamente as instruções fornecidas.",
  },
  {
    q: "Preciso pagar alguma coisa?",
    a: "Não. A participação é totalmente gratuita. Não cobramos taxa de cadastro, taxa de participação, taxa de saque nem qualquer outro valor. Se alguém cobrar em nome da Equipe Ademilson, desconfie.",
  },
  {
    q: "Quanto posso ganhar?",
    a: "Não informamos valores fixos porque o pagamento depende do projeto, da quantidade de vídeos aprovados e das regras vigentes em cada ciclo. Os valores e critérios são definidos pela plataforma parceira e podem mudar. Nunca prometemos uma renda mínima ou garantida.",
  },
  {
    q: "Como recebo o pagamento?",
    a: "A forma de recebimento depende das regras de cada projeto e plataforma. As instruções específicas são repassadas durante a orientação. A Equipe Ademilson não faz pagamentos diretamente.",
  },
  {
    q: "Quem pode participar?",
    a: "Em geral, adultos maiores de 18 anos com smartphone e acesso à internet. Os requisitos exatos podem variar de acordo com cada projeto disponível.",
  },
  {
    q: "Preciso morar em determinada cidade?",
    a: "A maioria dos projetos aceita participantes de qualquer região do Brasil. Verificamos disponibilidade conforme os projetos são anunciados.",
  },
  {
    q: "Preciso ter equipamento específico?",
    a: "É necessário ter um smartphone e, geralmente, um suporte para gravação em primeira pessoa (POV). Os requisitos técnicos de cada projeto (resolução, formato, etc.) são informados antes de iniciar as gravações.",
  },
  {
    q: "O trabalho é garantido?",
    a: "Não. A disponibilidade de projetos pode variar. Não garantimos continuidade de trabalho nem quantidade mínima de tarefas. Tratamos isso como uma oportunidade complementar, não como um emprego formal.",
  },
  {
    q: "Como fico sabendo de novos projetos?",
    a: "Participantes cadastrados recebem informações pelo grupo de WhatsApp da equipe. Fique atento às novidades compartilhadas no grupo.",
  },
  {
    q: "Como funciona a aprovação dos vídeos?",
    a: "Cada projeto tem seus próprios critérios de qualidade: luminosidade, enquadramento, duração, tipo de tarefa, etc. Os vídeos são avaliados pela plataforma parceira. A Equipe Ademilson não controla nem garante a aprovação.",
  },
  {
    q: "Como funciona a indicação?",
    a: "Após o cadastro, você recebe um código de indicação exclusivo. Ao compartilhar sua página personalizada, as pessoas que se cadastrarem serão vinculadas a você. Os benefícios por indicação, se houver, serão informados conforme regras do projeto vigente.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <span className="section-tag">Dúvidas frequentes</span>
          <h2 className="section-title">Perguntas <span>Frequentes</span></h2>
          <p className="section-subtitle">Transparência total. Se sua dúvida não estiver aqui, fale com a gente pelo WhatsApp.</p>
        </div>
        <div className={styles.list}>
          {faqs.map((faq, i) => (
            <div key={i} className={`${styles.item} ${open === i ? styles.itemOpen : ""}`}>
              <button className={styles.question} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span>{faq.q}</span>
                <span className={styles.icon}>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className={styles.answer}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
