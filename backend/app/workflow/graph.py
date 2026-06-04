from langgraph.graph import StateGraph, START, END
from app.workflow.state import ClaimState
from app.workflow.nodes import (
    document_extraction_node,
    policy_lookup_node,
    claim_history_node,
    coverage_calculator_node,
    eligibility_decision_node,
    recommendation_node,
    decision_node
)
from langgraph.checkpoint.memory import MemorySaver

def build_workflow():
    """
    Assembles individual nodes into a LangGraph state machine workflow.
    Configures a state checkpointer and inserts an interrupt barrier
    prior to executing the human verification step.
    """
    workflow = StateGraph(ClaimState)
    
    # Add processing nodes
    workflow.add_node("document_extraction", document_extraction_node)
    workflow.add_node("policy_lookup", policy_lookup_node)
    workflow.add_node("claim_history", claim_history_node)
    workflow.add_node("coverage_calculator", coverage_calculator_node)
    workflow.add_node("eligibility_decision", eligibility_decision_node)
    workflow.add_node("recommendation", recommendation_node)
    workflow.add_node("decision_node", decision_node)
    
    # Setup execution paths
    workflow.add_edge(START, "document_extraction")
    workflow.add_edge("document_extraction", "policy_lookup")
    workflow.add_edge("policy_lookup", "claim_history")
    workflow.add_edge("claim_history", "coverage_calculator")
    workflow.add_edge("coverage_calculator", "eligibility_decision")
    workflow.add_edge("eligibility_decision", "recommendation")
    
    # Connect the final recommendation to decision_node.
    # By configuring compiled graph to interrupt BEFORE decision_node,
    # we pause and wait for the human approval submission.
    workflow.add_edge("recommendation", "decision_node")
    workflow.add_edge("decision_node", END)
    
    # Using MemorySaver for single-process ease-of-run.
    # In full production deployments, this is replaced by PostgresSaver.
    checkpointer = MemorySaver()
    
    compiled_graph = workflow.compile(
        checkpointer=checkpointer,
        interrupt_before=["decision_node"]
    )
    return compiled_graph

compiled_graph = build_workflow()
if __name__ == "__main__":
    print("LangGraph workflow assembled and compiled successfully.")
